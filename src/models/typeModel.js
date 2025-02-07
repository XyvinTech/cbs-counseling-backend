const mongoose = require("mongoose");

const typeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Type = mongoose.model("Type", typeSchema);

module.exports = Type;
