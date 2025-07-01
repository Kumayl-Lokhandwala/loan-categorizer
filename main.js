import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Ollama } from "@langchain/ollama";
import { retriever } from "./vector.js";
import readline from "readline/promises";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new Ollama({
  baseUrl: process.env.OLLAMA_HOST,
  model: "deepseek-r1:7b",
  temperature: 0.2,
});

// Strict JSON-only prompt template
const template = `
You are a customer service classifier. Analyze this email and respond with ONLY the JSON output described below.

EMAIL:
Subject: {subject}
Body: {body}

AVAILABLE CATEGORIES (ONLY USE THESE):
{categories}

STRICT RULES:
1. Use ONLY this JSON format (NO other text, NO markdown):
{
  "category": "EXACT_CATEGORY_FROM_LIST",
  "subcategory": "EXACT_SUBCATEGORY_FROM_LIST",
  "confidence": "high/medium/low",
  "match_reason": "Specific phrase: '[quoted text]'"
}
2. If no match, set both to "Uncategorized"
3. NEVER invent new categories
4. NEVER add any text outside the JSON`;

const prompt = ChatPromptTemplate.fromTemplate(template);
const chain = RunnableSequence.from([prompt, model, new StringOutputParser()]);

// Updated classifyEmail function with better JSON enforcement
async function classifyEmail(subject, body) {
  try {
    // 1. Retrieve relevant categories
    const relevantDocs = await retriever.invoke(`${subject}\n${body}`, { k: 3 });
    
    if (relevantDocs.length === 0) {
      return {
        category: "Uncategorized",
        subcategory: "Uncategorized",
        confidence: "low",
        match_reason: "No matching categories found"
      };
    }

    // 2. Create strict options list
    const categoryOptions = relevantDocs.map(doc => ({
      category: doc.metadata.category,
      subcategory: doc.metadata.subcategory,
      description: doc.metadata.description
    }));

    // 3. Force JSON output with examples
    const strictPrompt = `
    Analyze this email and respond with ONLY VALID JSON using EXACTLY these options:
    ${JSON.stringify(categoryOptions, null, 2)}

    Email Subject: ${subject}
    Email Body: ${body}

    RESPONSE FORMAT (ONLY JSON, NO OTHER TEXT):
    {
      "category": "EXACT_MATCH_FROM_OPTIONS_ABOVE",
      "subcategory": "EXACT_MATCH_FROM_OPTIONS_ABOVE",
      "confidence": "high/medium/low",
      "match_reason": "Specific matching phrase from email"
    }
    If no match, use "Uncategorized" for both fields.`;

    const response = await model.invoke(strictPrompt);

    // 4. Extract JSON from response
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    const jsonString = response.slice(jsonStart, jsonEnd);
    const result = JSON.parse(jsonString);

    // 5. Validate response
    const isValid = categoryOptions.some(opt => 
      opt.category === result.category && 
      opt.subcategory === result.subcategory
    );

    return isValid ? result : {
      category: "Uncategorized",
      subcategory: "Uncategorized",
      confidence: "low",
      match_reason: "No valid category match found"
    };

  } catch (error) {
    return {
      category: "Uncategorized",
      subcategory: "Uncategorized",
      confidence: "low",
      match_reason: `System error: ${error.message}`
    };
  }
}
// Enhanced CLI with JSON output
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("✉️  Email Classification System");
    console.log("Enter email details (type 'quit' to exit):");

    while (true) {
      try {
        const subject = await rl.question("\nSubject: ");
        if (subject.toLowerCase() === 'quit') break;
        
        console.log("\nBody (press enter twice to finish):");
        let bodyLines = [];
        while (true) {
          const line = await rl.question("> ");
          if (line.trim() === '' && bodyLines.length > 0) break;
          if (line.trim() !== '') bodyLines.push(line);
        }
        const body = bodyLines.join('\n');

        console.log("\n🔍 Analyzing email...");
        const result = await classifyEmail(subject, body);

        console.log("\nJSON RESPONSE:");
        console.log(JSON.stringify(result, null, 2));

      } catch (error) {
        console.log(JSON.stringify({
          error: "Processing failed",
          details: error.message
        }, null, 2));
      }
    }
  } finally {
    rl.close();
  }
}

main().catch(console.error);