import express from 'express';
import * as medicineController from '../controllers/medicine.controller';

const router = express.Router();

router
    .route('/')
    .get(medicineController.getMedicines)
    .post(medicineController.createMedicine);

router
    .route('/:id')
    .get(medicineController.getMedicine)
    .patch(medicineController.updateMedicine)
    .delete(medicineController.deleteMedicine);

export default router;
