import mongoose from "mongoose";
import platforms from "../constants/platforms";
import difficulty from "../constants/difficulty";
import languageExtensions from "../constants/languages";

const { Schema } = mongoose;

const schema = new Schema(
  {
    user_id: { type: "ObjectId", ref: "User" },
    language: {
      type: String,
      trim: true,
      required: true,
      default: "javascript",
      // enum: Object.keys(languageExtensions),
    },
    github_folder_path: {
      type: String,
      required: true,
      trim: true,
      // unique: true,
    },
    time_taken: String,
    organisation_id: { type: String, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// schema.index({ user_id: 1 });
// schema.index({ user_id: 1, updated_at: -1 });

// Post-save hook to update streaks
schema.post("save", async function (doc: any) {
  const Streak = mongoose.model("Streak");

  const userStreak = await Streak.findOne({ user_id: doc.user_id });

  const now: any = new Date();
  if (!userStreak) {
    // No streak entry exists, create one
    await Streak.create({
      user_id: doc.user_id,
      current_streak: 1,
      longest_streak: 1,
      last_submission_date: now,
    });
    return;
  }

  const lastSubmissionDate = userStreak.last_submission_date;
  const diffInHours = (now - lastSubmissionDate) / (1000 * 60 * 60);

  if (diffInHours <= 24) {
    // Within 24 hours, increase streak
    userStreak.current_streak += 1;
    userStreak.longest_streak = Math.max(
      userStreak.longest_streak,
      userStreak.current_streak
    );
  } else if (diffInHours > 48) {
    // More than 48 hours, reset streak
    userStreak.current_streak = 1;
  }

  userStreak.last_submission_date = now;
  await userStreak.save();
});

const UserSubmission = mongoose.model("poko_submission", schema);

UserSubmission.createIndexes()
  .then(() => {
    console.log("Indexes created successfully : Submission");
  })
  .catch((err: unknown) => {
    console.error("Error creating indexes Submission:", err);
  });

export default UserSubmission;
