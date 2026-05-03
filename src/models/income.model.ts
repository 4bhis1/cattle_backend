import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  source: 'milk_sale' | 'cattle_sale' | 'semen_sale' | 'waste_sale' | 'other';
  amount: number;
  date: Date;
  paymentMethod: 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'card';
  relatedCustomerId?: string; // ObjectId (Ref: User/Customer) - Required if source is milk_sale
  transactionIds?: string[]; // IDs of sales records being paid
  description: string;
  organisation_id: string;
}

const IncomeSchema: Schema = new Schema(
  {
    source: {
      type: String,
      enum: ['milk_sale', 'cattle_sale', 'semen_sale', 'waste_sale', 'other'],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'card'],
      required: true,
    },
    relatedCustomerId: { type: Schema.Types.ObjectId, ref: 'User' }, // Or Customer, assuming User
    transactionIds: [{ type: String }], // Keeping as string to avoid strict populate issues if Sales IDs are strings
    description: { type: String },
    organisation_id: { type: String, required: true },
  },
  { timestamps: true }
);

export const Income = mongoose.model<IIncome>('Income', IncomeSchema);
