import express from 'express';
import {
    createSeller,
    getAllSellers,
    getSeller,
    updateSeller,
    deleteSeller
} from '../controllers/seller.controller';

const router = express.Router();

router
    .route('/')
    .get(getAllSellers)
    .post(createSeller);

router
    .route('/:id')
    .get(getSeller)
    .patch(updateSeller)
    .delete(deleteSeller);

export default router;
