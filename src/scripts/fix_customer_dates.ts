
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Customer from '../models/customer.model';

dotenv.config();

async function fixCustomerDates() {
    await connectDB();
    console.log("Connected");

    // Update all customers to have createdAt in the past
    // So they appear in historical reports
    const result = await Customer.updateMany(
        {}, 
        { $set: { createdAt: new Date('2025-01-01') } }
    );

    console.log(`Updated ${result.modifiedCount} customers.`);
    process.exit(0);
}

fixCustomerDates();
