import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Dictionary Admin"
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    tokenVersion: {
      type: Number,
      min: 0,
      default: 0,
      select: false
    },
    passwordChangedAt: {
      type: Date,
      default: null,
      select: false
    },
    lastLoginAt: Date
  },
  {
    timestamps: true
  }
);

adminSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

adminSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const Admin = mongoose.model("Admin", adminSchema);
