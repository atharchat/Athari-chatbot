
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('salafi-scholar');

async function test() {
  const records = [{ id: 'test1', values: new Array(768).fill(0.123) }];
  try {
    await index.upsert(records);
    console.log('Array works!');
  } catch (e) {
    console.error('Array error:', e.message);
  }
}
test();
