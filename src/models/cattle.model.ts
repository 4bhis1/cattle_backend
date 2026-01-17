import mongoose, { Schema, Document } from 'mongoose';

export interface ICattle extends Document {
  name: string;
  cattleType: 'cow' | 'buffalo';
  gender: 'male' | 'female';
  breed: string;
  dateOfBirth: Date;
  dateOfAcquisition: Date;
  acquisitionType: 'purchased' | 'born';
  purchasePrice: number;
  expectedMilkProduction: number;
  fatPercentage: number;
  numberOfBirths: number;
  weight: {
    current: number;
    history: Array<{ weight: number; measuredAt: Date }>;
  };
  status: {
    current: 'active' | 'pregnant' | 'sick' | 'sold' | 'deceased' | 'dry';
    history: Array<{
      status: 'active' | 'pregnant' | 'sick' | 'sold' | 'deceased' | 'dry';
      measuredAt: Date;
      semen: String;
      reason: String;
    }>;
  };
  healthRecords: {
    lastCheckup: Date;
    vaccinations: Array<{
      vaccineName: string;
      administeredDate: Date;
      nextDueDate: Date;
    }>;
  };
  images: string[];
  notes: string;
  motherId?: string;
  sellerId?: string;
  createdAt: Date;
  updatedAt: Date;
  organisation_id: string;
}

const CattleSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    cattleType: { type: String, enum: ['cow', 'buffalo'], required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    breed: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    dateOfAcquisition: { type: Date, required: true },
    acquisitionType: { type: String, enum: ['purchased', 'born'], required: true },
    purchasePrice: { type: Number, default: 0 },
    expectedMilkProduction: { type: Number },
    fatPercentage: { type: Number },
    numberOfBirths: { type: Number, default: 0 },
    weight: {
      current: {
        type: Number,
        // required: true,
      },
      history: [
        {
          weight: {
            type: Number,
            // required: true,
          },
          measuredAt: {
            type: Date,
            // required: true,
          },
        },
      ],
    },
    status: {
      current: {
        type: String,
        enum: ['active', 'pregnant', 'sick', 'sold', 'deceased', 'dry'],
        default: 'active',
      },
      history: [
        {
          status: {
            type: String,
            enum: ['active', 'pregnant', 'sick', 'sold', 'deceased', 'dry'],
            default: 'active',
          },
          measuredAt: { type: Date, required: true },
          semen: { type: String },
          reason: { type: String },
        },
      ],
    },
    healthRecords: {
      lastCheckup: { type: Date },
      vaccinations: [
        {
          vaccineName: { type: String, required: true },
          administeredDate: { type: Date, required: true },
          nextDueDate: { type: Date },
        },
      ],
    },
    images: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    motherId: { type: Schema.Types.ObjectId, ref: 'Cattle' },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
  organisation_id: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICattle>('Cattle', CattleSchema);
