import express from 'express';
import * as salesController from '../controllers/sales.controller';

const router = express.Router();

router.get('/daily', salesController.getDailySales);
router.post('/bulk', salesController.bulkUpsertSales);
router.get('/analytics', salesController.getSalesAnalytics);

router
    .route('/')
    .get(salesController.getAllSales)
    .post(salesController.createSale);

router
    .route('/:id')
    .get(salesController.getSale)
    .patch(salesController.updateSale)
    .delete(salesController.deleteSale);

export default router;
