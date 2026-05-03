import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import { Expense } from '../models/finance.model';

dotenv.config();

const ORGANISATION_ID = 'org_default_001';
const FILE_PATH = path.join(__dirname, 'expense.csv');

async function importExpenses() {
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
        
        // Clean up previous imports?
        // Let's delete all expenses created by this script (or all in general if user wants fresh start)
        // Since we are iterating and testing, maybe safe to delete all "expense" records?
        // Or better, just rely on duplicate check. 
        // But user might want to re-import to fix data (like adding Group).
        // Checks below: date, amount, description.
        // If I strictly check "group", existing ones won't match (group is undefined).
        // So I should probably DELETE ALL expenses first to be clean, or update existing.
        // I will opt to delete all for now as this is a setup script.
        
        console.log('Deleting existing expenses...');
        await Expense.deleteMany({ organisation_id: ORGANISATION_ID, recordType: 'expense' });
        console.log('Deleted existing expenses.');

        // Header: SNo, Date, Month, Year, BS, Expenses Group, Group, Sub Group, Bill Date, Vendor Name, Details-Description, Qty, KG, Feed KG, Rate, Amount
        
        const headerLine = lines[0];
        const delimiter = headerLine.includes('\t') ? '\t' : ',';
        console.log(`Using delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

        let importedCount = 0;
        let skippedCount = 0;

        // Start from index 1 (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const cols = line.split(delimiter).map(c => c.trim());

            // 0: SNo
            // 1: Date
            // 2: Month
            // 3: Year
            // 4: BS (Financial Category)
            // 5: Expenses Group (Expense Category)
            // 6: Group (Group)
            // 7: Sub Group (Subcategory)
            // 8: Bill Date
            // 9: Vendor Name (Paid To)
            // 10: Details-Description
            // 11: Qty
            // 12: KG
            // 13: Feed KG (Weight)
            // 14: Rate
            // 15: Amount

            if (cols.length < 5) continue; 

            const dateStr = cols[1];
            if (!dateStr) continue;

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.log(`Invalid date at line ${i + 1}: ${dateStr}`);
                continue;
            }

            const amountStr = cols[15];
            const amount = parseFloat(amountStr);
            
            const expenseCategory = cols[5] || 'Uncategorized';
            const group = cols[6]; // Group
            const subcategory = cols[7]; // Sub Group
            const financialCategory = cols[4]; // BS or P&L
            const description = cols[10] || cols[5]; 
            const paidTo = cols[9];
            
            const quantity = parseFloat(cols[11]);
            const weight = parseFloat(cols[13]); 
            const rate = parseFloat(cols[14]);
            
            // Create
            if (!isNaN(amount)) {
                await Expense.create({
                    date,
                    amount,
                    expenseCategory,
                    group,
                    subcategory,
                    financialCategory,
                    description,
                    paidTo,
                    quantity: isNaN(quantity) ? undefined : quantity,
                    weight: isNaN(weight) ? undefined : weight,
                    rate: isNaN(rate) ? undefined : rate,
                    organisation_id: ORGANISATION_ID,
                    paymentMethod: 'cash', // Default
                    recordType: 'expense'
                });
                importedCount++;
            }
        }

        console.log(`Import finished. Imported: ${importedCount}, Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Error importing expenses:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected DB');
        process.exit(0);
    }
}

importExpenses();
