
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Customer from '../models/customer.model';

dotenv.config();

async function forceUpdate() {
    await connectDB();
    console.log("Connected to DB");

    // Use native collection to bypass Mongoose timestamps magic
    const result = await Customer.collection.updateMany(
        {}, 
        { 
            $set: { 
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date()
            } 
        } as any
    );

    console.log(`Forced update on ${result.modifiedCount} documents.`);
    
    // Verify one
    const check = await Customer.findOne();
    console.log("Verification sample:", check?.createdAt);

    process.exit(0);
}

forceUpdate();
