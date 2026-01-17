import mongoose, { Schema, Document } from 'mongoose';

export interface IFeed extends Document {
    feedType: 'dry-fodder' | 'green-fodder' | 'concentrate' | 'silage' | 'mineral-mix';
    name: string;
    supplier: string;
    unitOfMeasure: 'kg' | 'quintal' | 'ton' | 'bundle';
    currentStock: number;
    minimumStock: number;
    averageDailyConsumption: number;
    pricePerUnit: number;
    lastPurchaseDate: Date;
    expiryDate?: Date;
    nutritionalInfo: {
        protein: number;
        energy: number;
        fiber: number;
    };
    storageLocation: string;
    organisation_id: string;
}

const FeedSchema: Schema = new Schema({
    feedType: { type: String, enum: ['dry-fodder', 'green-fodder', 'concentrate', 'silage', 'mineral-mix'], required: true },
    name: { type: String, required: true },
    supplier: { type: String },
    unitOfMeasure: { type: String, enum: ['kg', 'quintal', 'ton', 'bundle'], required: true },
    currentStock: { type: Number, required: true, default: 0 },
    minimumStock: { type: Number, default: 0 },
    averageDailyConsumption: { type: Number },
    pricePerUnit: { type: Number },
    lastPurchaseDate: { type: Date },
    expiryDate: { type: Date },
    nutritionalInfo: {
        protein: Number,
        energy: Number,
        fiber: Number
    },
    storageLocation: { type: String },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export const Feed = mongoose.model<IFeed>('Feed', FeedSchema);


export interface IFeedInStock extends Document {
    feedId: string;
    transactionType: 'purchase' | 'consumption' | 'wastage' | 'adjustment';
    quantity: number;
    unitOfMeasure: string;
    pricePerUnit: number;
    totalAmount: number;
    supplier: string;
    billNumber: string;
    transactionDate: Date;
    consumedBy?: Array<{ cattleId: string; quantity: number }>;
    notes: string;
    createdBy: string;
    organisation_id: string;
}

const FeedInStockSchema: Schema = new Schema({
    feedId: { type: String, required: true },
    transactionType: { type: String, enum: ['purchase', 'consumption', 'wastage', 'adjustment'], required: true },
    quantity: { type: Number, required: true },
    unitOfMeasure: { type: String },
    pricePerUnit: { type: Number },
    totalAmount: { type: Number },
    supplier: { type: String },
    billNumber: { type: String },
    transactionDate: { type: Date, default: Date.now },
    consumedBy: [{
        cattleId: String,
        quantity: Number
    }],
    notes: String,
    createdBy: String,
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export const FeedInStock = mongoose.model<IFeedInStock>('FeedInStock', FeedInStockSchema);
