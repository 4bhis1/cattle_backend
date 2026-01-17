import express from 'express';
import * as cattleController from '../controllers/cattle.controller';

const router = express.Router();

router
    .route('/')
    .get(cattleController.getCattles)
    .post(cattleController.createCattle);

router
    .route('/:id')
    .get(cattleController.getCattle)
    .put(cattleController.updateCattle)
    .delete(cattleController.deleteCattle);

export default router;
