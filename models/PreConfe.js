import mongoose from "mongoose";

const preConfeSchema = new mongoose.Schema(
  {
    preconfeId: {
      type: String,
      required: true,
      unique: true, // important for lookups
    },

    title: {
      type: String,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    // -1 means unlimited
    maxPersons: {
      type: Number,
      required: true,
      default: -1,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PreConfe ||
  mongoose.model("PreConfe", preConfeSchema);