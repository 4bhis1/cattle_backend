import { Medicine, MedicineApplication } from '../models/medicine.model';
import * as factory from './handlerFactory';

export const getMedicines = factory.getAll(Medicine);
export const getMedicine = factory.getOne(Medicine);
export const createMedicine = factory.createOne(Medicine);
export const updateMedicine = factory.updateOne(Medicine);
export const deleteMedicine = factory.deleteOne(Medicine);

export const getMedicineApplications = factory.getAll(MedicineApplication);
export const getMedicineApplication = factory.getOne(MedicineApplication);
export const createMedicineApplication = factory.createOne(MedicineApplication);
export const updateMedicineApplication = factory.updateOne(MedicineApplication);
export const deleteMedicineApplication = factory.deleteOne(MedicineApplication);
