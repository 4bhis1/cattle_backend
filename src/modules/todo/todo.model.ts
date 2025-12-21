import mongoose, { Schema, Document } from 'mongoose';

export interface ITodo extends Document {
    title: string;
    description?: string;
    completed: boolean;
    user_id: string; // Belongs to user
    createdAt: Date;
    updatedAt: Date;
}

const TodoSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        completed: { type: Boolean, default: false },
        user_id: { type: String, required: true },
    },
    { timestamps: true }
);

export const Todo = mongoose.model<ITodo>('Todo', TodoSchema);
