const mongoose = require("mongoose");

const timeRemovalLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    time: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true,
      },
    },
    reason: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const TimeRemovalLog = mongoose.model("TimeRemovalLog", timeRemovalLogSchema);

module.exports = TimeRemovalLog;
