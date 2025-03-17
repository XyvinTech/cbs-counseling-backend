const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    image: { type: String },
    password: { type: String, trim: true },
    mobile: { type: String, trim: true },
    status: { type: Boolean, default: true },
    otp: { type: String },
    userType: {
      type: String,
      enum: ["counsellor", "student", "admin"],
    },
    designation: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    StudentReferencesCode: { type: String, trim: true },
    parentContact: { type: String, trim: true },
    division: { type: String, trim: true },
    counsellorType: {
      type: [String],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
