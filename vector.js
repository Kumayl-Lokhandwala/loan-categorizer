// knowledgeVectorStore.js
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";
import { OllamaEmbeddings } from "@langchain/ollama";
import fs from "fs/promises";

export async function setupVectorStore() {
  try {
    // Read and validate JSON
    const rawData = await fs.readFile("./knowledge.json", "utf-8");
    const knowledgeBase = JSON.parse(rawData);
    
    if (!Array.isArray(knowledgeBase)) {
      throw new Error("Invalid JSON format: Expected array");
    }

    console.log("✅ Successfully parsed JSON with", knowledgeBase.length, "categories");

    // Convert to documents
    const documents = knowledgeBase.map(item => {
      if (!item.category || !item.subcategory) {
        console.warn("⚠️ Missing required fields in item:", item);
      }
      return new Document({
        pageContent: [
          `Category: ${item.category}`,
          `Subcategory: ${item.subcategory}`,
          `Description: ${item.description}`,
          `Examples: ${item.examples.join("; ")}`
        ].join("\n"),
        metadata: item
      });
    });

    console.log("📝 Created", documents.length, "vector documents");

    // Create vector store
    const embeddings = new OllamaEmbeddings({
      model: "mxbai-embed-large",
      baseUrl: process.env.OLLAMA_HOST
    });

    const vectorStore = await FaissStore.fromDocuments(documents, embeddings);
    await vectorStore.save("./knowledge_vectors");
    
    console.log("🔢 Vector store created successfully");
    return vectorStore.asRetriever({ k: 3 });
    
  } catch (err) {
    console.error("❌ Error setting up vector store:", err);
    process.exit(1);
  }
}

export const retriever = await setupVectorStore();