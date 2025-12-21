import mongoose from "mongoose";

const { Schema } = mongoose;

const badgeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    threshold: { type: Number, required: true }, // No. of questions needed to earn this badge
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

const Badge = mongoose.model("poko_badge", badgeSchema);

export default Badge;
