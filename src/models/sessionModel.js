const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema(
  {
    session_id: { type: String },
    form_id: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
    case_id: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    session_date: { type: Date },
    session_time: { type: Object },
    interactions: { type: String },
    type: { type: String },
    status: {
      type: String,
      enum: ["pending", "progress", "cancelled", "completed", "rescheduled"],
      default: "pending",
    },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String },
    report: { type: String },
    case_details: { type: String },
    reschedule_remark: { type: String },
    cancel_remark: { type: String },
    c_reschedule_remark: { type: String },
    c_cancel_remark: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
