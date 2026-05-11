import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();
const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});
const index = pc.index('salafi-scholar');
async function run() {
  try {
    await index.deleteMany({ filter: { source: { "$eq": "أصول_السنة_لأحمد_بن_حنبل" } } });
    console.log('Delete successful');
    const stats = await index.describeIndexStats();
    console.log(stats);
  } catch(e) {
    console.error('Delete Error:', e);
  }
}
run();
