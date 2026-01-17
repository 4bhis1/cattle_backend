import express from 'express';
import * as milkController from '../controllers/milk.controller';

const router = express.Router();

router
    .route('/')
    .get(milkController.getMilks)
    .post(milkController.createMilk);

router.post('/bulk', milkController.bulkUpsertMilk);
router.get('/daily', milkController.getDailyMilkRecords);

router
    .route('/:id')
    .get(milkController.getMilk)
    .patch(milkController.updateMilk)
    .delete(milkController.deleteMilk);

export default router;
