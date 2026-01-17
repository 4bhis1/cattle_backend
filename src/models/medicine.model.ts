import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicine extends Document {
    medicineName: string;
    medicineType: 'antibiotic' | 'vaccine' | 'vitamin' | 'dewormer' | 'pain-relief' | 'other';
    manufacturer: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
    unitOfMeasure: 'ml' | 'tablet' | 'bottle' | 'injection' | 'packet';
    pricePerUnit: number;
    purchaseDate: Date;
    supplier: string;
    storageConditions: string;
    dosageInfo: string;
    withdrawalPeriod: number;
    currentStock: number;
    minimumStock: number;
    organisation_id: string;
}

const MedicineSchema: Schema = new Schema({
    medicineName: { type: String, required: true },
    medicineType: { type: String, enum: ['antibiotic', 'vaccine', 'vitamin', 'dewormer', 'pain-relief', 'other'], required: true },
    manufacturer: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    quantity: { type: Number },
    unitOfMeasure: { type: String, enum: ['ml', 'tablet', 'bottle', 'injection', 'packet'], required: true },
    pricePerUnit: { type: Number },
    purchaseDate: { type: Date },
    supplier: { type: String },
    storageConditions: { type: String },
    dosageInfo: { type: String },
    withdrawalPeriod: { type: Number },
    currentStock: { type: Number, required: true },
    minimumStock: { type: Number },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export const Medicine = mongoose.model<IMedicine>('Medicine', MedicineSchema);

export interface IMedicineApplication extends Document {
    cattleId: string;
    medicineId: string;
    treatmentDate: Date;
    reasonForTreatment: string;
    dosageGiven: number;
    unitOfMeasure: string;
    administeredBy: string;
    veterinarianName: string;
    veterinarianContact: string;
    followUpRequired: boolean;
    followUpDate?: Date;
    treatmentCost: number;
    treatmentStatus: 'ongoing' | 'completed' | 'discontinued';
    withdrawalEndDate: Date;
    notes: string;
    organisation_id: string;
}

const MedicineApplicationSchema: Schema = new Schema({
    cattleId: { type: String, required: true },
    medicineId: { type: String, required: true },
    treatmentDate: { type: Date, required: true },
    reasonForTreatment: { type: String },
    dosageGiven: { type: Number, required: true },
    unitOfMeasure: { type: String },
    administeredBy: { type: String },
    veterinarianName: { type: String },
    veterinarianContact: { type: String },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },
    treatmentCost: { type: Number },
    treatmentStatus: { type: String, enum: ['ongoing', 'completed', 'discontinued'], default: 'ongoing' },
    withdrawalEndDate: { type: Date },
    notes: { type: String },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export const MedicineApplication = mongoose.model<IMedicineApplication>('MedicineApplication', MedicineApplicationSchema);
