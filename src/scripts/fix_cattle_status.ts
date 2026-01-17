import mongoose from 'mongoose';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/cattle_directory');
    console.log('Connected.');

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection failed');
    }
    const collection = db.collection('cattles');

    const cursor = collection.find({});
    let count = 0;
    
    console.log('Scanning documents...');
    while(await cursor.hasNext()) {
        const doc = await cursor.next();
        if (doc && typeof doc.status === 'string') {
        console.log(`Fixing doc ${doc._id}: status was "${doc.status}"`);
        await collection.updateOne(
            { _id: doc._id },
            { 
            $set: { 
                status: { 
                current: doc.status, 
                history: [] 
                } 
            } 
            }
        );
        count++;
        }
    }

    console.log(`Fixed ${count} documents.`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
