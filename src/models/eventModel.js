const mongoose = require("mongoose");

const eventSchema = mongoose.Schema(
  {
    title: { type: String },
    date: { type: Date },
    venue: { type: String },
    guest: { type: String },
    requisition_image: { type: String },
    type: {
      type: String,
      enum: [
        "Team meetings",
        "session / workshop",
        "Other meeting",
        "Invigilation",
        "substitution",
        "lesson",
      ],
    },
    remainder: { type: [String] },
    details: { type: String },
    requisition_description: { type: String },
    creator: { type: String },
    counselor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    start_time: { type: Date },
    end_time: { type: Date },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
