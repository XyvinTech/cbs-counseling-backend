const mongoose = require("mongoose");

const timeIntervalSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const timeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    day: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
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
