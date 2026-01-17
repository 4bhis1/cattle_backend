import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    expenseCategory: 'feed' | 'medicine' | 'veterinary' | 'labor' | 'electricity' | 'water' | 'maintenance' | 'equipment' | 'transport' | 'other';
    subcategory: string;
    description: string;
    amount: number;
    date: Date;
    paymentMethod: 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'card';
    paidTo: string;
    billNumber: string;
    billImage?: string;
    relatedCattleId?: string;
    relatedTransactionId?: string;
    isRecurring: boolean;
    recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    paymentStatus: 'paid' | 'pending' | 'partial';
    notes: string;
    createdBy: string;
    organisation_id: string;
}

const ExpenseSchema: Schema = new Schema({
    expenseCategory: { type: String, enum: ['feed', 'medicine', 'veterinary', 'labor', 'electricity', 'water', 'maintenance', 'equipment', 'transport', 'other'], required: true },
    subcategory: { type: String },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'card'], required: true },
    paidTo: { type: String },
    billNumber: { type: String },
    billImage: { type: String },
    relatedCattleId: { type: String },
    relatedTransactionId: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'partial'], default: 'paid' },
    notes: { type: String },
    createdBy: { type: String },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);

export interface ISales extends Document {
    clientName: string;
    clientContact: string; // Used for customer ID reference or phone
    customerId?: string; // Explicit reference
    date: Date;
    session: 'morning' | 'evening';
    quantityInLiters: number;
    pricePerLiter: number;
    fat?: number; // Added fat
    totalAmount: number;
    paymentStatus: 'paid' | 'pending' | 'partial';
    paymentDate?: Date;
    paymentMethod?: 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'card';
    notes: string;
    organisation_id: string;
    recordType: 'sale' | 'waste';
    wasteReason?: string;
}

const SalesSchema: Schema = new Schema({
    recordType: { type: String, enum: ['sale', 'waste'], default: 'sale' },
    wasteReason: { type: String },
    clientName: { type: String },
    clientContact: { type: String },
    customerId: { type: String }, // Store ID
    date: { type: Date, required: true },
    session: { type: String, enum: ['morning', 'evening'] },
    quantityInLiters: { type: Number, required: true },
    pricePerLiter: { type: Number },
    fat: { type: Number },
    totalAmount: { type: Number },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'partial'], default: 'pending' },
    paymentDate: { type: Date },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'card'] },
    notes: { type: String },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export const Sales = mongoose.model<ISales>('Sales', SalesSchema);
