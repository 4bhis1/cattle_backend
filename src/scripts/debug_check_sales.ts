
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import { Sales } from '../models/finance.model';

dotenv.config();

async function checkSales() {
    await connectDB();
    console.log("Connected");

    // Check for sales around Jan 2026
    const sales = await Sales.find({
        date: {
            $gte: new Date("2026-01-18"),
            $lte: new Date("2026-01-23")
        }
    }).sort({ date: 1 });

    console.log(`Found ${sales.length} sales around Jan 20`);
    sales.forEach(s => {
        console.log(` - ID: ${s._id} | Date (ISO): ${s.date.toISOString()} | Date (Local): ${s.date.toString()} | Type: ${s.recordType} | Customer: ${s.clientName}`);
    });

    process.exit(0);
}

checkSales();
