import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyReport extends Document {
    date: Date;
    totalMilkProduced: number;
    totalMilkSold: number;
    totalMilkRevenue: number;
    totalExpenses: number;
    activeCattleCount: number;
    feedConsumed: Array<{ feedId: string; quantity: number }>;
    cattleHealth: {
        healthy: number;
        sick: number;
        underTreatment: number;
    };
    notes: string;
    organisation_id: string;
}

const DailyReportSchema: Schema = new Schema({
    date: { type: Date, required: true, unique: true },
    totalMilkProduced: { type: Number, default: 0 },
    totalMilkSold: { type: Number, default: 0 },
    totalMilkRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    activeCattleCount: { type: Number, default: 0 },
    feedConsumed: [{
        feedId: String,
        quantity: Number
    }],
    cattleHealth: {
        healthy: { type: Number, default: 0 },
        sick: { type: Number, default: 0 },
        underTreatment: { type: Number, default: 0 }
    },
    notes: { type: String },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export const DailyReport = mongoose.model<IDailyReport>('DailyReport', DailyReportSchema);

// Customer moved to customer.model.ts
