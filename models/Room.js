import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const roomSchema = new Schema(
  {
    id: { type: String, required: true },
    available: { type: String, required: true },
    count: { type: Number, required: true },
    guests: { type: Number, required: true },
  },
  { timestamps: true }
);

export default models.Room || model("Room", roomSchema);
