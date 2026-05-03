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
        
        console.log('Deleting existing sales...');
        await Sales.deleteMany({ organisation_id: ORGANISATION_ID, recordType: 'sale' });
        console.log('Deleted existing sales.');

        if (lines.length === 0) {
            console.log('File is empty');
            process.exit(0);
        }

        // Detect delimiter
        const headerLine = lines[0];
        const delimiter = headerLine.includes('\t') ? '\t' : ',';
        console.log(`Using delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

        const headers = headerLine.split(delimiter).map(h => h.trim());

        const customerBlocks: CustomerBlock[] = [];

        // Parse Headers to find customers
        // Structure: Date, [Qty, Rate, Value]...
        // Start from index 1.
        for (let i = 1; i < headers.length; i++) {
            const header = headers[i];
            if (!header) continue;

            // Check if this matches the pattern of a customer block start
            // We expect the *next* headers to be Rate and Sale Value
            // But sometimes empty headers exist.
            // Let's check headers[i+1] (Rate) and headers[i+2] (Sale Value)
            // Note: headers array might have empty strings for empty columns if consecutive delimiters
            
            const nextHeader = headers[i + 1] || '';
            const nextNextHeader = headers[i + 2] || '';

            if (nextHeader.toLowerCase().includes('rate') || nextNextHeader.toLowerCase().includes('value')) {
                 // It's a block.
                 let name = header;
                 let session: 'morning' | 'evening' | undefined = undefined;

                 if (name.includes('Shop-Qty Morning')) {
                     name = 'Shop';
                     session = 'morning';
                 } else if (name.includes('Shop-Qty Evening')) {
                     name = 'Shop';
                     session = 'evening';
                 } else {
                     // Clean "C-Qty-X Name" or "C-Qty-X"
                     // Remove "C-Qty-X " prefix
                     name = name.replace(/^C-Qty-\d+\s+/, ''); // "C-Qty-3 Ersad" -> "Ersad"
                     
                     // If it's just "C-Qty-X", rename to "Customer X"
                     if (/^C-Qty-\d+$/.test(name)) {
                         name = name.replace('C-Qty-', 'Customer ');
                     }
                 }
                 
                 // Avoid adding duplicates if we already processed?
                 // Wait, we iterate by index, so we add each block.
                 // "Shop" will appear twice (Morning and Evening).
                 
                 customerBlocks.push({ name, colIndex: i, sessionOverride: session });
                 
                 // Advance index. Usually block is 3 columns.
                 // But wait, are there empty columns between blocks?
                 // Looking at CSV: Value, (Empty), C-Qty...
                 // So we skip Rate, Value. i -> i+2. Loop increments i -> i+3.
                 // We should manually verify skipping.
                 // Simple logic: if we consumed this as a block start, we might want to skip the next known rate/value columns.
                 // But loop increments by 1. So if we process i, and i+1 is Rate, we encounter Rate next loop.
                 // We should skip inside loop or add safeguards.
            }
        }

        console.log(`Found ${customerBlocks.length} customer blocks.`);
        customerBlocks.forEach(b => console.log(` - ${b.name} (Idx: ${b.colIndex}, Session: ${b.sessionOverride || 'default'})`));

        // 1. Create Customers
        // We only create unique customers by name.
        const uniqueNames = Array.from(new Set(customerBlocks.map(b => b.name)));
        
        for (const [idx, name] of uniqueNames.entries()) {
             // Check if exists
             let customer = await Customer.findOne({ name: name, organisation_id: ORGANISATION_ID });
             if (!customer) {
                 // Find default rate from first block matching this name
                 const block = customerBlocks.find(b => b.name === name);
                 let defaultRate = 45;
                 if (block) {
                     for (let j = 1; j < lines.length; j++) {
                         const cols = lines[j].split(delimiter).map(c => c.trim());
                         if (cols.length > block.colIndex + 1) {
                             const rate = parseFloat(cols[block.colIndex + 1]);
                             if (!isNaN(rate) && rate > 0) {
                                 defaultRate = rate;
                                 break;
                             }
                         }
                     }
                 }
                 
                 // Generate fake phone: 99900000 + index
                 const uniqueSuffix = idx.toString().padStart(3, '0');
                 const randomStart = Math.floor(10000 + Math.random() * 90000).toString();
                 const phone = `999${randomStart}${uniqueSuffix}`;
                 
                 customer = await Customer.create({
                     name: name,
                     phone: phone, // Hope for uniqueness
                     organisation_id: ORGANISATION_ID,
                     defaultMorningRate: defaultRate,
                     defaultEveningRate: defaultRate,
                     address: 'Unknown',
                     isActive: true
                 });
                 console.log(`Created customer: ${name} (Rate: ${defaultRate})`);
             } else {
                 console.log(`Customer exists: ${name}`);
             }
        }
        
        // 2. Insert Sales
        let salesCount = 0;
        let skippedCount = 0;
        
        for (let j = 1; j < lines.length; j++) {
            const row = lines[j].split(delimiter).map(c => c.trim());
            // Filter really empty rows
            if (row.length < 2) continue;

            const dateStr = row[0];
            if (!dateStr) continue;
            
            // Handle date format M/D/YYYY
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.log(`Skipping invalid date row: ${dateStr}`);
                continue;
            }

            for (const block of customerBlocks) {
                if (block.colIndex >= row.length) continue;
                
                const qtyStr = row[block.colIndex];
                
                // Check valid qty
                if (!qtyStr || qtyStr === '-' || qtyStr === '') continue;
                
                const qty = parseFloat(qtyStr);
                if (isNaN(qty) || qty <= 0) continue;

                // Get Rate (col + 1)
                const rateStr = row[block.colIndex + 1];
                const rate = parseFloat(rateStr) || 0;

                // Find customer
                const customer = await Customer.findOne({ name: block.name, organisation_id: ORGANISATION_ID });
                if (!customer) {
                    console.log(`Warning: Customer not found for ${block.name}`);
                    continue;
                }

                // Determine session
                const session = block.sessionOverride || 'morning';

                // Check existing
                const existingSale = await Sales.findOne({
                    customerId: customer._id,
                    date: date,
                    session: session,
                    organisation_id: ORGANISATION_ID,
                    quantityInLiters: qty
                });

                if (!existingSale) {
                    await Sales.create({
                        recordType: 'sale',
                        clientName: customer.name,
                        clientContact: customer.phone,
                        customerId: customer._id,
                        date: date,
                        session: session,
                        quantityInLiters: qty,
                        pricePerLiter: rate,
                        totalAmount: qty * rate,
                        paymentStatus: 'pending',
                        organisation_id: ORGANISATION_ID
                    });
                    salesCount++;
                } else {
                    skippedCount++;
                }
            }
        }

        console.log(`Import Complete. Imported: ${salesCount}, Skipped (Existing): ${skippedCount}`);
        
    } catch (err) {
        console.error('Error importing sales:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected DB');
        process.exit(0);
    }
}

importSales();
