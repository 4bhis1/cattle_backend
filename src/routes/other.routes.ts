import express from 'express';
import * as otherController from '../controllers/other.controller';

const router = express.Router();



router.route('/daily-reports')
    .get(otherController.getDailyReports)
    .post(otherController.createDailyReport);

router.route('/daily-reports/:id')
    .get(otherController.getDailyReport)
    .patch(otherController.updateDailyReport)
    .delete(otherController.deleteDailyReport);

// Customers moved to customer.routes.ts

export default router;
