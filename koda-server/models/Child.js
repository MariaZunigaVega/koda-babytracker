const mongoose = require("mongoose");

const ChildSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    weight: {
      type: String,
      default: "",
    },
    allergies: {
      type: String,
      default: "",
    },
    other: {
      type: String,
      default: "",
    },
    moodExplanation: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Child", ChildSchema);