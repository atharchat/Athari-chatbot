import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import crypto from "crypto";
import { TopicFolderMap, Topic } from "./types.js";
import {
  chunkText,
  getEmbeddings,
  upsertChunks,
  getPineconeClient,
} from "./services/vectorService.js";

dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env if needed

const upload = multer({ dest: "uploads/" }); // Files temporarily saved to 'uploads' dir

async function checkAndIndexLibrary() {
  console.log("Mock: checkAndIndexLibrary bypassed for now.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check and index data on startup
  checkAndIndexLibrary();

  app.post("/api/chat", async (req, res) => {
    try {
      const { query, topic } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      console.log(
        `Processing mock chat for query: "${query}", topic: "${topic || "all"}"`,
      );

      // Dynamically import the mock RAG pipeline
      const { executeRagPipeline } = await import("./src/lib/rag/pipeline.js");
      const answer = await executeRagPipeline(query);

      res.json({
        context: "Mock Context",
        answer: answer,
        success: true,
      });
    } catch (err: any) {
      console.error("Chat Error:", err);
      res
        .status(500)
        .json({
          error: "Failed to process chat",
          details: err?.message,
          stack: err?.stack,
        });
    }
  });

  // API route example - later, we'll implement vector DB/RAG here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/force-index", async (req, res) => {
    try {
      await checkAndIndexLibrary();
      res.json({ status: "success" });
    } catch (e: any) {
      res.status(500).json({ error: e.message, stack: e.stack });
    }
  });

  // Endpoints for uploading and indexing documents
  app.post("/api/upload", upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { topic } = req.body; // e.g. "aqeedah"

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded." });
      }

      if (!topic) {
        return res.status(400).json({ error: "No topic provided." });
      }

      console.log(`Processing ${files.length} files for topic: ${topic}`);

      let totalChunksProcessed = 0;

      for (const file of files) {
        // Only processing text files for now
        if (
          file.mimetype === "text/plain" ||
          file.mimetype === "text/html" ||
          file.originalname.endsWith(".txt") ||
          file.originalname.endsWith(".html") ||
          file.originalname.endsWith(".htm")
        ) {
          const text = fs.readFileSync(file.path, "utf8");

          const originalnameUtf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
          let chunks: any[] = [];
          if (file.originalname.endsWith(".html") || file.originalname.endsWith(".htm")) {
            const cheerio = await import("cheerio");
            const $ = cheerio.load(text);
            const bookTitle =
              $("title").first().text() ||
              originalnameUtf8.replace(/\.html?$/, "");

            $(".PageText").each((i, el) => {
              const pageTextDiv = $(el);
              const pageHead = pageTextDiv.find(".PageHead");
              const partName =
                pageHead.find(".PartName").text().trim() || bookTitle;
              const pageNumStr = pageHead
                .find(".PageNumber")
                .text()
                .replace(/[^\d١-٩]/g, "")
                .trim();

              // Clean up headers and footnotes for the text
              pageHead.remove();
              const pageText = pageTextDiv.text().replace(/\\s+/g, " ").trim();
              if (pageText) {
                chunks.push({
                  id: crypto.randomUUID(),
                  text: pageText,
                  metadata: {
                    source: bookTitle,
                    topic,
                    page: pageNumStr || undefined,
                  },
                });
              }
            });
          } else {
            chunks = chunkText(text, { source: originalnameUtf8, topic });
          }

          // 2. Map chunks and get embeddings in batches
          const batchSize = 100;
          for (let i = 0; i < chunks.length; i += batchSize) {
            const currentChunks = chunks.slice(i, i + batchSize);
            const texts = currentChunks.map((c) => c.text);

            // Get embeddings
            const embeddings = await getEmbeddings(texts);

            // Assign embeddings
            currentChunks.forEach((chunk, index) => {
              chunk.embedding = embeddings[index];
            });

            // Upsert to Pinecone
            await upsertChunks(currentChunks);
          }

          totalChunksProcessed += chunks.length;
        }

        // Clean up temporary file
        fs.unlinkSync(file.path);
      }

      res.json({
        message: "Files processed and indexed successfully",
        chunksIndexed: totalChunksProcessed,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process files." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Determine __dirname since we're in ESM
    const __dirname = path.resolve();
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
