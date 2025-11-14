// models/User.js
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    country: { type: String, required: true },
    clubName: { type: String, required: true },
    birthday: { type: Date, required: true },
    password: { type: String, required: true },

    // Password reset fields
    resetToken: { type: String },          // the random token
    resetTokenExpiry: { type: Date },      // token expiration time
  },
  { timestamps: true }
);


export default models.User || model("User", userSchema);
