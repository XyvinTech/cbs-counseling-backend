const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    case_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    details: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
