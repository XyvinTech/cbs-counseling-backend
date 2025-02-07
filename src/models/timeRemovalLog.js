const mongoose = require("mongoose");

const timeRemovalLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    },
    time: {
      start: {
        type: String,
      },
      end: {
        type: String,
      },
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

const TimeRemovalLog = mongoose.model("TimeRemovalLog", timeRemovalLogSchema);

module.exports = TimeRemovalLog;
