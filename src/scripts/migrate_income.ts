
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Expense } from '../models/finance.model';
import { Income } from '../models/income.model';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cattle_directory');
        console.log('Connected to Database');

        // Find all expenses that are actually income (recordType was undefined in schema but might exist in DB if not cleaned)
        // Since I removed recordType from schema, I need to use collection directly or ignore schema strict
        // But Mongoose strictQuery might prevent fetching it via Model if not in schema.
        // Actually, existing documents STILL have recordType in MongoDB.
        
        // Use lean to get raw documents including fields not in schema
        const expenses = await Expense.find({ recordType: 'income' } as any).lean();

        console.log(`Found ${expenses.length} income records in Expense collection.`);

        for (const exp of expenses) {
            const expenseDoc: any = exp;
            
            // Map to new Income model
            const newIncome = new Income({
                source: 'other', // Default source as we don't know
                amount: expenseDoc.amount,
                date: expenseDoc.date,
                paymentMethod: expenseDoc.paymentMethod || 'cash',
                description: expenseDoc.description,
                organisation_id: expenseDoc.organisation_id,
                // Add validation/defaults if missing
            });

            await newIncome.save();
            console.log(`Migrated income: ${newIncome._id}`);

            // Delete from Expense
            await Expense.deleteOne({ _id: expenseDoc._id });
        }

        console.log('Migration completed.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
