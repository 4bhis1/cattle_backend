
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Customer from '../models/customer.model';

dotenv.config();

const MAPPINGS = [
    { old: 'Shop', new: 'Shop-Ashok Ji', rate: 35 },
    { old: 'Customer 1', new: 'Customer-1 Shivam', rate: 50 },
    { old: 'Customer 2', new: 'Customer-2 Balinder Rai', rate: 50 },
    { old: 'Ersad Chicket', new: 'Customer-3 Esad Chicket Shop', rate: 50 },
    { old: 'Ankit', new: 'Customer-4 Ankit', rate: 40 },
    { old: 'KC Shekhar', new: 'Customer-5 KC Shekhar', rate: 50 },
    { old: 'Sale Point-Sudha M', new: 'Sudha Sale Point-Manshi', rate: 31.33 },
    { old: 'Sale Point-Bisunpur', new: 'Sudha Sale Point-Bisunpur', rate: 38.54 },
    { old: 'Krishan Mohan', new: 'Krishn Mohan Patel', rate: 50 }, // Assuming 50 default
    { old: 'Niraj Kymar', new: 'Niraj Kumar', rate: 50 },
    { old: 'Consumption at Farm', new: 'Consumption at Farm', rate: 0 },
    { old: 'Lakhinder', new: 'Lakhinder', rate: 50 },
    { old: 'Prabhu Patel', new: 'Prabhu Patel', rate: 50 },
    { old: 'Vickey', new: 'Vickey', rate: 50 }
];

async function updateCustomers() {
    await connectDB();
    console.log("Connected to DB");

    // 1. Update Names and Rates
    for (const map of MAPPINGS) {
        const res = await Customer.updateOne(
            { name: map.old },
            { 
                $set: { 
                    name: map.new,
                    defaultMorningRate: map.rate,
                    defaultEveningRate: map.rate
                } 
            }
        );
        if (res.modifiedCount > 0) {
            console.log(`Updated ${map.old} -> ${map.new}`);
        } else {
            console.log(`Skipped ${map.old} (Not found or already updated)`);
        }
    }

    // 2. Fix Dates (Crucial)
    // We update ALL customers to be created in 2025 so they appear in historical records
    // leveraging proper date object
    const dateFix = await Customer.updateMany(
        {}, 
        { 
            $set: { 
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date()
            } 
        }
    );
    console.log(`Fixed dates for ${dateFix.modifiedCount} customers.`);

    process.exit(0);
}

updateCustomers();
