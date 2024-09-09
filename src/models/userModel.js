const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    mobile: { type: String },
    designation: { type: String },
    userType: {
      type: String,
      enum: ["counsellor", "student"],
    },
    counsellorType: {
      type: [String],
    },
    parentContact: { type: String },
    division: { type: String },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
