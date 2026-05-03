
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Customer from '../models/customer.model';

dotenv.config();

async function debugDailySales() {
    await connectDB();
    console.log("Connected to DB");

    const dateStr = "2026-01-09";
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    console.log(`Querying for createdAt < ${endOfDay.toISOString()}`);

    // 1. Check ALL active customers
    const allActive = await Customer.find({ isActive: true });
    console.log(`Total Active Customers: ${allActive.length}`);
    if (allActive.length > 0) {
        console.log("Sample Active Customer:", JSON.stringify(allActive[0], null, 2));
    }

    // 2. Check Query
    const query = { 
        isActive: true,
        createdAt: { $lt: endOfDay }
    };
    const customers = await Customer.find(query);
    console.log(`Customers found with date query: ${customers.length}`);

    if (customers.length === 0) {
        console.log("Why? Let's check dates of active customers:");
        allActive.forEach(c => {
            console.log(` - ${c.name}: ${c.createdAt} (Time: ${c.createdAt.getTime()})`);
        });
        console.log(`Limit Time: ${endOfDay.getTime()}`);
    } else {
        console.log("Customers found:");
        customers.forEach(c => console.log(` - ${c.name}`));
    }

    process.exit(0);
}

debugDailySales();
