const mongoose = require("mongoose");

const formSchema = mongoose.Schema(
  {
    name: { type: String },
    grNumber: { type: String },
    referee: {
      type: String,
      enum: ["student", "parent", "teacher"],
    },
    refereeName: { type: String },
    email: { type: String },
    class: { type: String },
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
