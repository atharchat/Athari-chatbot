
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('salafi-scholar');

async function test() {
  console.log('pinecone version:', require('@pinecone-database/pinecone/package.json').version);
  try {
    await index.upsert([ { id: 'test1', values: new Array(768).fill(0.123) } ]);
    console.log('Passed format 1');
  } catch (e) {
    console.log('Failed format 1:', e.message);
  }
}
test();
