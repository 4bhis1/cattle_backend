import mongoose, { Schema, Document } from 'mongoose';

export interface IMilk extends Document {
    cattleId: string;
    session: 'morning' | 'evening' | 'night';
    date: Date;
    quantity: number;
    fat: number;
    organisation_id: string;
}

const MilkSchema: Schema = new Schema({
    cattleId: { type: String, required: true }, // Ideally ObjectId ref 'Cattle' but keeping string for flexibility/compat with mock
    session: { type: String, enum: ['morning', 'evening', 'night'], required: true },
    date: { type: Date, required: true },
    quantity: { type: Number, required: true },
    fat: { type: Number },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IMilk>('Milk', MilkSchema);
