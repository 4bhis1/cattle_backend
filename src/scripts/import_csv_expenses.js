const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Minimal Schema to avoid TS issues
const expenseSchema = new mongoose.Schema({
    date: Date,
    recordType: { type: String, enum: ['expense', 'income'], required: true },
    expenseCategory: String,
    subcategory: String,
    source: String,
    description: String,
    amount: Number,
    paymentMethod: String,
    paidTo: String,
    isRecurring: Boolean,
    organisation_id: String
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

const DB = 'mongodb://localhost:27017/cattle_directory';

mongoose.connect(DB).then(() => {
    console.log('DB connection successful!');
}).catch(err => {
    console.error('DB Connection Failed:', err);
    process.exit(1);
});

const importData = async () => {
    const results = [];
    const filePath = path.join(__dirname, 'expense.csv');

    console.log(`Reading file from: ${filePath}`);

    fs.createReadStream(filePath)
        .pipe(csv({ separator: '\t' })) // Try Tab separator
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsing complete. Found ${results.length} records.`);
            if (results.length > 0) {
                 console.log('Sample Row:', results[0]);
            }
            
            let count = 0;
            const errors = [];

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
                } catch (err) {
                    errors.push(err.message);
                }
            }

            console.log(`Imported ${count} expenses successfully.`);
            process.exit();
        });
};

importData();
