import mongoose, { Schema, Document } from 'mongoose';

export interface ISeller extends Document {
    name: string;
    phoneNumber: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    organisation_id: string;
}

const SellerSchema: Schema = new Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ISeller>('Seller', SellerSchema);
