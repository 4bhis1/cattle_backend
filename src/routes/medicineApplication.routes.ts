import express from 'express';
import * as medicineController from '../controllers/medicine.controller';

const router = express.Router();

router
    .route('/')
    .get(medicineController.getMedicineApplications)
    .post(medicineController.createMedicineApplication);

router
    .route('/:id')
    .get(medicineController.getMedicineApplication)
    .patch(medicineController.updateMedicineApplication)
    .delete(medicineController.deleteMedicineApplication);

export default router;
