import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const manageLibrary = async () => {
    const action = process.argv[2];
    const sourceName = process.argv.slice(3).join(' ');

    if (!action || !['delete'].includes(action)) {
        console.error("Usage: npm run manage-library delete \"Book Title\"");
        process.exit(1);
    }

    if (!sourceName) {
        console.error("Please provide the book source name.");
        console.error("Example: npm run manage-library delete \"ثلاثة الأصول\"");
        process.exit(1);
    }

    console.log(`Action: ${action}, Target: ${sourceName}`);

    const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
    if (!PINECONE_API_KEY) {
        console.error("PINECONE_API_KEY is missing. Aborting.");
        process.exit(1);
    }

    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pc.index("salafi-scholar");

    if (action === 'delete') {
        try {
            console.log(`Attempting to delete all chunks for book/source: "${sourceName}"...`);
            await index.deleteMany({ filter: { source: { $eq: sourceName } } });
            console.log("Successfully deleted from Pinecone.");
        } catch (error) {
            console.error("Error deleting from Pinecone:", error);
        }
    }
};

manageLibrary();
