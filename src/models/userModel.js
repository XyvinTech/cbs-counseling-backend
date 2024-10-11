const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    mobile: { type: String, trim: true },
    designation: { type: String },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dob: { type: Date },
    StudentReferencesCode: { type: String },
    userType: {
      type: String,
      enum: ["counsellor", "student"],
    },
    counsellorType: {
      type: [String],
    },
    parentContact: { type: String, trim: true },
    division: { type: String },
    status: {
      type: Boolean,
      default: false,
    },
    otp: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
