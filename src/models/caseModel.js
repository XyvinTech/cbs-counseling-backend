const mongoose = require("mongoose");

const caseSchema = mongoose.Schema(
  {
    case_id: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    concern_raised: { type: Date },
    referer: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
    referer_remark: { type: [Object] },
    reason_for_closing: { type: String },
    status: {
      type: String,
      enum: ["pending", "progress", "cancelled", "completed", "referred"],
      default: "pending",
    },
    session_ids: { type: [mongoose.Schema.Types.ObjectId], ref: "Session" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Case = mongoose.model("Case", caseSchema);

module.exports = Case;
