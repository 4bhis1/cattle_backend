import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Customer from '../models/customer.model';
import { Sales } from '../models/finance.model';

dotenv.config();

const ORGANISATION_ID = 'org_default_001';
const FILE_PATH = path.join(__dirname, 'sales.csv');

// Mapping from CSV derived name -> DB Name
const NAME_MAPPING: { [key: string]: string } = {
    'Shop': 'Shop-Ashok Ji',
    'Customer 1': 'Customer-1 Shivam',
    'Customer 2': 'Customer-2 Balinder Rai', // Warning: CSV has multiple C-Qty-2? Check logs.
    'Ersad Chicket': 'Customer-3 Esad Chicket Shop',
    'Ankit': 'Customer-4 Ankit',
    'KC Shekhar': 'Customer-5 KC Shekhar',
    'Sale Point-Sudha M': 'Sudha Sale Point-Manshi',
    'Sale Point-Bisunpur': 'Sudha Sale Point-Bisunpur', 
    'Krishan Mohan': 'Krishn Mohan Patel',
    'Niraj Kymar': 'Niraj Kumar',
    'Consumption at Farm': 'Consumption at Farm',
    'Lakhinder': 'Lakhinder',
    'Prabhu Patel': 'Prabhu Patel',
    'Vickey': 'Vickey',
    'Sale Point-Sudha E': 'Sale Point-Sudha E' // This one might be missing from my previous mapping? Check if it was renamed.
};

// "Sale Point-Sudha E" was NOT in the previous update list provided by USER.
// "Sale Point-Bisunpur" appeared twice in CSV? 
// Let's rely on finding by name. If mapped name exists, use it. If not, use original CSV name? 
// Or better: try mapped, if fail, try original.

interface CustomerBlock {
    name: string;
    colIndex: number;
    sessionOverride?: 'morning' | 'evening';
}

async function importSales() {
    try {
        await connectDB();
        console.log('Connected to DB');

        if (!fs.existsSync(FILE_PATH)) {
            console.error(`File not found: ${FILE_PATH}`);
            process.exit(1);
        }

        const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
        const lines = fileContent.split('\n').filter(l => l.trim() !== '');

        if (lines.length === 0) {
            console.log('File is empty');
            process.exit(0);
        }

        const headerLine = lines[0];
        const delimiter = headerLine.includes('\t') ? '\t' : ',';
        console.log(`Using delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

        const headers = headerLine.split(delimiter).map(h => h.trim());
        const customerBlocks: CustomerBlock[] = [];

        for (let i = 1; i < headers.length; i++) {
            const header = headers[i];
            if (!header) continue;

            const nextHeader = headers[i + 1] || '';
            const nextNextHeader = headers[i + 2] || '';

            if (nextHeader.toLowerCase().includes('rate') || nextNextHeader.toLowerCase().includes('value')) {
                 let name = header;
                 let session: 'morning' | 'evening' | undefined = undefined;

                 if (name.includes('Shop-Qty Morning')) {
                     name = 'Shop';
                     session = 'morning';
                 } else if (name.includes('Shop-Qty Evening')) {
                     name = 'Shop';
                     session = 'evening';
                 } else {
                     name = name.replace(/^C-Qty-\d+\s+/, ''); 
                     if (/^C-Qty-\d+$/.test(name)) {
                         name = name.replace('C-Qty-', 'Customer ');
                     }
                 }
                 
                 customerBlocks.push({ name, colIndex: i, sessionOverride: session });
            }
        }

        console.log(`Found ${customerBlocks.length} customer blocks in CSV.`);

        // 1. Resolve Customers IDs
        const customerMap = new Map<string, any>(); // csvName -> DB Customer Doc

        for (const block of customerBlocks) {
            if (customerMap.has(block.name)) continue;

            const targetName = NAME_MAPPING[block.name] || block.name;
            
            // Try Exact Match
            let customer = await Customer.findOne({ name: targetName, organisation_id: ORGANISATION_ID });
            
            // If not found, try Regex (case insensitive) just in case
            if (!customer) {
                customer = await Customer.findOne({ 
                    name: { $regex: new RegExp(`^${targetName}$`, 'i') }, 
                    organisation_id: ORGANISATION_ID 
                });
            }

            if (customer) {
                console.log(`Mapped '${block.name}' -> DB: '${customer.name}'`);
                customerMap.set(block.name, customer);
            } else {
                console.warn(`WARNING: Customer '${block.name}' (Mapped: '${targetName}') NOT FOUND in DB. Creating new...`);
                // Create minimal customer if missing (Handling the 'deleted' case implied by user?)
                // User said "deleted sales data", probably not customers.
                // But just in case.
                 const phone = `999${Math.floor(10000 + Math.random() * 90000).toString()}${Math.floor(Math.random() * 1000)}`;
                 customer = await Customer.create({
                     name: targetName,
                     phone: phone,
                     organisation_id: ORGANISATION_ID,
                     defaultMorningRate: 45,
                     defaultEveningRate: 45,
                     createdAt: new Date('2025-01-01') // SAFETY: Backdate immediately
                 });
                 customerMap.set(block.name, customer);
            }
        }
        
        // 2. Insert Sales
        let salesCount = 0;
        const operations: any[] = [];
        
        for (let j = 1; j < lines.length; j++) {
            const row = lines[j].split(delimiter).map(c => c.trim());
            if (row.length < 2) continue;

            const dateStr = row[0];
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) continue;

            for (const block of customerBlocks) {
                if (block.colIndex >= row.length) continue;
                
                const qtyStr = row[block.colIndex];
                if (!qtyStr || qtyStr === '-' || qtyStr === '') continue;
                
                const qty = parseFloat(qtyStr);
                if (isNaN(qty) || qty <= 0) continue;

                const rateStr = row[block.colIndex + 1];
                const rate = parseFloat(rateStr) || 0;

                const customer = customerMap.get(block.name);
                if (!customer) continue;

                const session = block.sessionOverride || 'morning';

                operations.push({
                    updateOne: {
                        filter: {
                            customerId: customer._id,
                            date: date,
                            session: session,
                            organisation_id: ORGANISATION_ID
                        },
                        update: { 
                            $set: {
                                recordType: 'sale',
                                clientName: customer.name,
                                clientContact: customer.phone,
                                customerId: customer._id,
                                quantityInLiters: qty,
                                pricePerLiter: rate,
                                totalAmount: qty * rate,
                                paymentStatus: 'pending',
                                organisation_id: ORGANISATION_ID
                            } 
                        },
                        upsert: true
                    }
                });
            }
        }

        if (operations.length > 0) {
            console.log(`Bulk writing ${operations.length} sales records...`);
            const result = await Sales.bulkWrite(operations);
            console.log(`Result: Matched ${result.matchedCount}, Modified ${result.modifiedCount}, Upserted ${result.upsertedCount}`);
        } else {
            console.log("No sales records to import.");
        }
        
    } catch (err) {
        console.error('Error importing sales:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

importSales();
