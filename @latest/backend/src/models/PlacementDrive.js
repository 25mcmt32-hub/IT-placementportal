import mongoose from "mongoose";

const DRIVE_DEGREE_OPTIONS = ["All Degrees", "IMTech", "MTech(CS)", "MTech(AI)"];

const driveApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    regno: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      default: "",
      trim: true,
    },
    branch: {
      type: String,
      default: "",
      trim: true,
    },
    degree: {
      type: String,
      default: "",
      trim: true,
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
    collegeName: {
      type: String,
      default: "University of Hyderabad",
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: "",
      trim: true,
    },
    companyFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const placementDriveSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    minCgpa: {
      type: String,
      required: true,
      trim: true,
    },
    deadline: {
      type: String,
      required: true,
      trim: true,
    },
    degree: {
      type: String,
      required: true,
      trim: true,
      enum: DRIVE_DEGREE_OPTIONS,
      default: "All Degrees",
    },
    jdFileName: {
      type: String,
      default: "",
      trim: true,
    },
    jdOriginalName: {
      type: String,
      default: "",
      trim: true,
    },
    jdUrl: {
      type: String,
      default: "",
      trim: true,
    },
    applicationFields: {
      type: [
        {
          key: {
            type: String,
            required: true,
            trim: true,
          },
          label: {
            type: String,
            required: true,
            trim: true,
          },
          source: {
            type: String,
            enum: ["student", "custom"],
            default: "custom",
            trim: true,
          },
          required: {
            type: Boolean,
            default: true,
          },
          order: {
            type: Number,
            default: 1,
          },
        },
      ],
      default: [],
    },
    createdBy: {
      type: String,
      default: "",
      trim: true,
    },
    applications: {
      type: [driveApplicationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "placement_drives",
  }
);

export default mongoose.model("PlacementDrive", placementDriveSchema);
