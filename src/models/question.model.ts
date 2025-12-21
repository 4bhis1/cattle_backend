import mongoose from "mongoose";

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    question_id: { type: String, required: true, unique: true }, // Platform's unique ID
    title: { type: String, required: true, trim: true },
    description: { type: String }, // Question description for search
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    tags: [{ type: String, trim: true }],
    platform: {
      type: String,
      required: true,
      enum: ["LeetCode", "GFG", "CodeForces", "CodeChef", "HackerRank", "BFE"],
    },
    companies: [{ type: String, trim: true }], // Used for filtering
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

const Question = mongoose.model("poko_question", questionSchema);

export default Question;
