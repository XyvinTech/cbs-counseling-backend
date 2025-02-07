const mongoose = require("mongoose");

const timeIntervalSchema = mongoose.Schema(
  {
    start: {
      type: String,
    },
    end: {
      type: String,
    },
  },
  { _id: false }
);

const timeSchema = mongoose.Schema(
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
    times: {
      type: [timeIntervalSchema],
    },
  },
  { timestamps: true }
);

const Time = mongoose.model("Time", timeSchema);

module.exports = Time;
