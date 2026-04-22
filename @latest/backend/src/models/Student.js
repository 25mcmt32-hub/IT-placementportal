import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    regno: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    degree: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    tenth: {
      type: String,
      default: "",
      trim: true,
    },
    twelfth: {
      type: String,
      default: "",
      trim: true,
    },
    ug: {
      type: String,
      default: "",
      trim: true,
    },
    pg: {
      type: String,
      default: "",
      trim: true,
    },
    resumeFileName: {
      type: String,
      default: "",
      trim: true,
    },
    resumeOriginalName: {
      type: String,
      default: "",
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: "",
      trim: true,
    },
    placed: {
      type: Boolean,
      default: false,
    },
    blacklist: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "students",
  }
);

export default mongoose.model("Student", studentSchema);
