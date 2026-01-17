import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    phone: string;
    address: string;
    email?: string;
    rateGroup?: 'A' | 'B' | 'C'; // Optional: for different pricing tiers
    defaultMorningRate?: number;
    defaultEveningRate?: number;
    isActive: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    organisation_id: string;
}

const CustomerSchema: Schema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String },
    email: { type: String },
    rateGroup: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
    defaultMorningRate: { type: Number, default: 45 },
    defaultEveningRate: { type: Number, default: 45 },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
