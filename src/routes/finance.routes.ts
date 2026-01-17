import express from 'express';
import * as financeController from '../controllers/finance.controller';

const router = express.Router();

router.route('/expenses')
    .get(financeController.getExpenses)
    .post(financeController.createExpense);

router.route('/expenses/:id')
    .get(financeController.getExpense)
    .patch(financeController.updateExpense)
    .delete(financeController.deleteExpense);

// Sales moved to sales.routes.ts

export default router;
