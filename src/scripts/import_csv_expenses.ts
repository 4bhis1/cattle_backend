import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
const csv = require('csv-parser');
import Expense from '../models/expense.model';
import dotenv from 'dotenv';

dotenv.config();

const DB = process.env.DATABASE || 'mongodb://localhost:27017/my_dairy';

mongoose.connect(DB).then(() => {
    console.log('DB connection successful!');
}).catch(err => {
    console.error('DB Connection Failed:', err);
    process.exit(1);
});

const importData = async () => {
    const results: any[] = [];
    const filePath = path.join(__dirname, 'expense.csv');

    console.log(`Reading file from: ${filePath}`);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
            console.log(`Parsing complete. Found ${results.length} records.`);
            
            let count = 0;
            const errors: any[] = [];

            for (const row of results) {
                try {
                    const dateStr = row['Date']; 
                    const amountRaw = row['Amount'];
                    
                    const amount = amountRaw ? parseFloat(amountRaw.replace(/,/g, '').trim()) : 0;
                    
                    if (!dateStr || isNaN(amount) || amount === 0) {
                        continue;
                    }

                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) {
                        continue;
                    }

                    const record = {
                        date: date,
                        expenseCategory: row['Group'] || row['Expenses Group'] || 'Uncategorized',
                        subcategory: row['Sub Group'], 
                        amount: amount,
                        description: row['Details-Description'] || row['Vendor Name'] || `Imported Expense`,
                        paymentMethod: 'cash', 
                        paidTo: row['Vendor Name'],
                        isRecurring: false,
                        organisation_id: 'org_123', 
                        recordType: 'expense' 
                    };

                    await Expense.create(record);
                    count++;
                } catch (err: any) {
                    errors.push(err.message);
                }
            }

            console.log(`Imported ${count} expenses successfully.`);
            process.exit();
        });
};

importData();
