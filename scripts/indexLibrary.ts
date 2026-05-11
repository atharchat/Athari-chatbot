import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: '.env.local' });
dotenv.config();

import { chunkText, getEmbeddings, upsertChunks, getPineconeClient } from "../services/vectorService.js";

const DATA_DIR = path.resolve("data", "books");

const getFilesRecursively = (dir: string, fileList: { path: string; topic: string; filename: string }[] = []) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else if (file.endsWith(".txt") || file.endsWith(".html")) {
      // Assuming folder name is topic
      const topic = path.basename(path.dirname(filePath));
      fileList.push({ path: filePath, topic, filename: file });
    }
  }

  return fileList;
};

const indexLibrary = async () => {
    console.log("Starting library indexing...");
    
    // Test pinecone config
    if(!getPineconeClient()) {
        console.error("PINECONE_API_KEY environment variable is not set. Aborting.");
        return;
    }

    const files = getFilesRecursively(DATA_DIR);
    console.log(`Found ${files.length} files to index.`);

    let totalChunksProcessed = 0;

    for (const file of files) {
        console.log(`Processing file: ${file.filename} (Topic: ${file.topic})`);
        
        let text = fs.readFileSync(file.path, "utf-8");
        
        let chunks: any[] = [];
        if (file.filename.endsWith(".html")) {
           const cheerio = await import('cheerio');
           const $ = cheerio.load(text);
           const bookTitle = $('title').first().text() || file.filename.replace('.html', '');
           
           $('.PageText').each((i, el) => {
             const pageTextDiv = $(el);
             const pageHead = pageTextDiv.find('.PageHead');
             const pageNumStr = pageHead.find('.PageNumber').text().replace(/[^\d١-٩]/g, '').trim(); 
             pageHead.remove(); 
             
             const pageText = pageTextDiv.text().replace(/\\s+/g, ' ').trim();
             if (pageText) {
               chunks.push({
                 id: crypto.randomUUID(),
                 text: pageText,
                 metadata: {
                   source: bookTitle,
                   topic: file.topic,
                   page: pageNumStr || undefined
                 }
               });
             }
           });
        } else {
           chunks = chunkText(text, { source: file.filename, topic: file.topic });
        }
        console.log(`  -> Split into ${chunks.length} chunks.`);

        const batchSize = 100;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const currentChunks = chunks.slice(i, i + batchSize);
            const texts = currentChunks.map(c => c.text);
            
            try {
                const embeddings = await getEmbeddings(texts);
                
                currentChunks.forEach((chunk, index) => {
                    chunk.embedding = embeddings[index];
                });

                const filtered = currentChunks.filter(c => c.embedding && c.embedding.length > 0);
                if (filtered.length > 0) {
                    await upsertChunks(filtered);
                    console.log(`  -> Upserted batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(chunks.length / batchSize)}`);
                } else {
                    console.error('All embeddings were empty');
                }
            } catch (err: any) {
                 console.error(`  -> Failed to index batch: ${err?.message}`);
            }
        }
        totalChunksProcessed += chunks.length;
    }

    console.log(`\nIndexing complete! Processed ${files.length} files and upserted ${totalChunksProcessed} chunks.`);
};

indexLibrary().catch(console.error);
