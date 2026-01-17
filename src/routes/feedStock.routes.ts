import express from 'express';
import * as feedController from '../controllers/feed.controller';

const router = express.Router();

router
    .route('/')
    .get(feedController.getFeedStocks)
    .post(feedController.createFeedStock);

router
    .route('/:id')
    .get(feedController.getFeedStock)
    .patch(feedController.updateFeedStock)
    .delete(feedController.deleteFeedStock);

export default router;
