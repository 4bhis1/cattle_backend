import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
    filename: string;
    path: string;
    url: string;
    mimetype: string;
    size: number;
    status: 'temp' | 'active';
    createdAt: Date;
    updatedAt: Date;
    organisation_id: string;
}

const FileSchema: Schema = new Schema({
    filename: { type: String, required: true },
    path: { type: String, required: true }, // Local path
    url: { type: String, required: true }, // Public URL
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    status: { type: String, enum: ['temp', 'active'], default: 'temp' },
    organisation_id: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IFile>('File', FileSchema);
