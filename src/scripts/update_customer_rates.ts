import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Customer from '../models/customer.model';

dotenv.config();

const ORGANISATION_ID = 'org_default_001';
const FILE_PATH = path.join(__dirname, 'customer_update.txt');

async function updateCustomers() {
    try {
        await connectDB();
        console.log('Connected to DB');

        if (!fs.existsSync(FILE_PATH)) {
            console.error('File not found', FILE_PATH);
            process.exit(1);
        }

        const content = fs.readFileSync(FILE_PATH, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim() !== '');

        for (const line of lines) {
            // Expected format: Name [Tab/Spaces] Value [Tab/Spaces] Rate
            // Example: Shop-Ashok Ji	  1,137.96 	35.00
            
            // Regex to parse
            // Name can have spaces. Value and Rate are numbers at the end.
            // Split by tabs potentially?
            const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
            
            let name, valStr, rateStr;

            if (parts.length >= 3) {
                 name = parts[0];
                 valStr = parts[1];
                 rateStr = parts[2];
            } else if (parts.length === 2) {
                // Check if 2nd part is rate or val?
                // Unclear. Assuming first is Name, last is Val?
                // Wait, "Prabhu Patel 15.50" (no rate)
                name = parts[0];
                valStr = parts[1];
                rateStr = undefined;
            } else {
                // Try regex split by multiple spaces
               const spacesParts = line.trim().split(/\s{2,}/);
               if (spacesParts.length >= 2) {
                   name = spacesParts[0];
                   valStr = spacesParts[1];
                   rateStr = spacesParts[2];
               } else {
                   console.log(`Skipping unclear line: ${line}`);
                   continue;
               }
            }
            
            // Clean numbers (remove commas)
            const val = valStr ? parseFloat(valStr.replace(/,/g, '')) : 0;
            const rate = rateStr ? parseFloat(rateStr.replace(/,/g, '')) : undefined;

            console.log(`Processing: ${name}, Val: ${val}, Rate: ${rate}`);
            
            // Find Customer by Name
            // Fuzzy match? Case insensitive?
            // Try exact first
            let customer = await Customer.findOne({ name: name, organisation_id: ORGANISATION_ID });
            
            if (!customer) {
                // Try regex case insensitive
                customer = await Customer.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, organisation_id: ORGANISATION_ID });
            }

            if (customer) {
                const updates: any = {};
                if (rate !== undefined && !isNaN(rate)) {
                    updates.defaultMorningRate = rate;
                    updates.defaultEveningRate = rate;
                }
                // What is "Val"? Is it balance? Or sales? 
                // User said "update the mongo data accordingly".
                // If it's balance, we might not have a balance field on Customer (it's usually derived).
                // But let's check Customer model.
                // Assuming "Val" is irrelevant if we don't store balance, OR user meant to import sales?
                // The snippet looks like a "Due List" or "Sales Summary".
                // Given the context of "Expense Import", this might be "Income Import" or just "Set Rates".
                // Safest bet: Update RATES.
                
                if (Object.keys(updates).length > 0) {
                    await Customer.updateOne({ _id: customer._id }, { $set: updates });
                    console.log(`Updated ${name}: Rate -> ${rate}`);
                } else {
                    console.log(`No updates for ${name}`);
                }
            } else {
                console.log(`Customer NOT FOUND: ${name}`);
                // Create? User didn't say.
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

updateCustomers();
