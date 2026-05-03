import express from 'express';
import * as financeController from '../controllers/finance.controller';

const router = express.Router();

router.get('/analytics', financeController.getProfitLossAnalytics);
router.get('/transactions', financeController.getAllTransactions);

// Expense Routes
router.route('/expenses')
    .get(financeController.getExpenses)
    .post(financeController.createExpense);

router.route('/expenses/:id')
    .get(financeController.getExpense)
    .patch(financeController.updateExpense)
    .delete(financeController.deleteExpense);

// Income Routes
router.route('/income')
    .get(financeController.getIncomes)
    .post(financeController.createIncome);

router.route('/income/:id')
    .get(financeController.getIncome)
    .patch(financeController.updateIncome)
    .delete(financeController.deleteIncome);

export default router;
