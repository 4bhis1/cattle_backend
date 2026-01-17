import mongoose from "mongoose";

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    user_id: { type: "ObjectId", ref: "User", required: true },
    question_id: { type: "ObjectId", ref: "Question", required: true },
    title: { type: String, default: "Notes" },
    content: { type: String, required: true }, // User's note content
    github_folder_path: {
      type: String,
      required: true,
      trim: true,
    },
    organisation_id: { type: String, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

const Notes = mongoose.model("poko_notes", noteSchema);

export default Notes;
