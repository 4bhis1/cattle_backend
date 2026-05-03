const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    date: Date,
    recordType: String,
    amount: Number,
    expenseCategory: String,
    description: String,
    organisation_id: String
});
const Expense = mongoose.model('Expense', expenseSchema);

const DB = 'mongodb://localhost:27017/my_dairy';

mongoose.connect(DB).then(async () => {
    console.log('DB Connected');
    const count = await Expense.countDocuments();
    const sample = await Expense.findOne().sort({ date: -1 });
    console.log('Total Expenses:', count);
    console.log('Sample Expense:', sample);
    process.exit();
}).catch(err => console.error(err));
