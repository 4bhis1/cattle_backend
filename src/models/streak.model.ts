import mongoose from "mongoose";

const { Schema } = mongoose;

const streakSchema = new Schema(
  {
    user_id: {
      type: "ObjectId",
      ref: "User",
      required: true,
      unique: true,
    },
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_submission_date: { type: Date },
    organisation_id: { type: String, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

const Streak = mongoose.model("poko_streak", streakSchema);

export default Streak;
