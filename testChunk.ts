import fs from "fs";
import { chunkText } from "./services/vectorService.js";

const text = fs.readFileSync("data/books/aqeedah/Al-iman_abu_ubaid.txt", "utf-8");
console.log("File length:", text.length);

const chunks = chunkText(text, { source: "test", topic: "test" });
console.log("Chunks count:", chunks.length);
