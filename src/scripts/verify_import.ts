import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import { Expense } from '../models/finance.model';

dotenv.config();

async function verifyImport() {
    await connectDB();
    console.log('Connected to DB');

    const count = await Expense.countDocuments({ createdBy: { $exists: false } }); // Assuming script didn't set createdBy
    console.log(`Total Expenses in DB: ${count}`);

    const sample = await Expense.findOne().sort({ createdAt: -1 });
    console.log('Sample Expense:', JSON.stringify(sample, null, 2));

    await mongoose.disconnect();
}

verifyImport();
