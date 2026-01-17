import express from 'express';
import * as feedController from '../controllers/feed.controller';

const router = express.Router();

// Feeds
router
    .route('/')
    .get(feedController.getFeeds)
    .post(feedController.createFeed);

router
    .route('/:id')
    .get(feedController.getFeed)
    .patch(feedController.updateFeed)
    .delete(feedController.deleteFeed);

export default router;
