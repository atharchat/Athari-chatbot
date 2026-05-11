import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});
  const index = pc.index('salafi-scholar');
  try {
     console.log('Sending deleteMany...');
     await index.deleteMany({ filter: { source: { $eq: "أصول_السنة_لأحمد_بن_حنبل" } } });
     console.log('Deleted successfully?');
     const stats = await index.describeIndexStats();
     console.log(stats);
  } catch (e) {
     console.error('Delete error', e);
  }
}
test();
