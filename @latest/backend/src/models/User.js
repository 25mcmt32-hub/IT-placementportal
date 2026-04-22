import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["student", "faculty", "coordinator"],
      default: "student",
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: function requiredEmail() {
        return this.role === "student";
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    regno: {
      type: String,
      required: function requiredRegno() {
        return this.role === "student";
      },
      unique: true,
      sparse: true,
      trim: true,
    },
    year: {
      type: String,
      required: function requiredYear() {
        return this.role === "student";
      },
      trim: true,
      default: "",
    },
    branch: {
      type: String,
      required: function requiredBranch() {
        return this.role === "student";
      },
      trim: true,
      default: "",
    },
    degree: {
      type: String,
      required: function requiredDegree() {
        return this.role === "student";
      },
      trim: true,
      default: "",
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
  }
);

export default mongoose.model("User", userSchema);
