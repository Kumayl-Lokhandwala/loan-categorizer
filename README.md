# Intelligent Email Classifier Agent 📨🤖

## 📖 Overview

Developed during my software engineering internship, this project solves the problem of manual customer support triage. It is a local-first AI agent that automatically analyzes incoming customer emails and classifies them into specific business categories with strict JSON output.

Unlike simple keyword matching, this system uses **Retrieval-Augmented Generation (RAG)** to understand the semantic meaning of the email and map it to a dynamic knowledge base defined in `knowledge.json`.

## 🚀 Key Features

* **RAG Architecture:** Uses Vector Search (Faiss) to retrieve only the relevant classification rules for a specific email, allowing the system to scale to hundreds of categories without confusing the LLM.
* **Strict JSON Enforcement:** Implements a robust prompt engineering strategy to ensure the LLM outputs machine-parsable JSON, making it ready for API integration.
* **Local Privacy:** Built on **Ollama** using `deepseek-r1:7b` and `mxbai-embed-large`, ensuring customer data never leaves the local infrastructure.
* **Confidence Scoring:** Returns high/medium/low confidence ratings and explains *why* a specific match was made.

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Orchestration:** LangChain.js
* **LLM Engine:** Ollama (DeepSeek R1)
* **Vector Database:** Faiss (Facebook AI Similarity Search)
* **Embeddings:** mxbai-embed-large

## ⚙️ Architecture

1. **Ingestion:** The system loads the included `knowledge.json` file defining business categories.
2. **Vectorization:** Categories are converted into embeddings and stored in a local Faiss store.
3. **Retrieval:** When an email arrives, the system queries the vector store for the top 3 most relevant category definitions.
4. **Generation:** A strict prompt containing the email and the *specific* relevant categories is sent to the LLM.
5. **Validation:** The output is parsed and validated against the allowed schema.

## 📦 Installation

### 1. Prerequisites

Ensure you have [Ollama](https://ollama.com/) installed and running. Pull the required models:

```bash
ollama pull deepseek-r1:7b
ollama pull mxbai-embed-large

```

### 2. Clone and Install

```bash
git clone https://github.com/Kumayl-Lokhandwala/loan-categorizer.git
cd loan-categorizer
npm install

```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
OLLAMA_HOST=http://localhost:11434

```

## 🏃‍♂️ Usage

1. **Initialize the Vector Store:**
On the first run, the system will automatically read `knowledge.json` and generate the vector embeddings.
2. **Run the CLI:**
```bash
npm start

```


3. **Interact:**
Paste an email subject and body when prompted.

**Example Interaction:**

```text
Subject: Invoice Issue
Body: I was charged $50 instead of $20 for the basic plan. Please fix this.

🔍 Analyzing email...

JSON RESPONSE:
{
  "category": "Billing",
  "subcategory": "Overcharge Dispute",
  "confidence": "high",
  "match_reason": "Specific phrase: 'charged $50 instead of $20'"
}

```

## 📝 Configuration

The classification rules are not hardcoded. You can modify **`knowledge.json`** to change how the AI categorizes emails.

**Data Format:**

```json
[
  {
    "category": "Billing",
    "subcategory": "Refund",
    "description": "Requests for money back or transaction reversals",
    "examples": ["I want a refund", "return my money", "charged twice"]
  }
]

```

*Modify this file and restart the application to update the vector store.*

## 🧠 What I Learned

* **Prompt Engineering:** How to constrain LLMs to output strict formats (JSON) rather than conversational text using specific delimiters and examples.
* **Vector Embeddings:** Understanding how to map semantic similarity between user queries and static documentation.
* **LangChain Chains:** How to build sequential runnable flows (Prompt -> Model -> Parser).
* **Error Handling in AI:** Managing hallucinations or "Uncategorized" edge cases when the AI cannot find a match.

## 🔮 Future Improvements

* Add a REST API wrapper using Express.js.
* Implement a feedback loop where human corrections update the Vector Store.
* Add support for multi-turn conversations if the email requires clarification.
