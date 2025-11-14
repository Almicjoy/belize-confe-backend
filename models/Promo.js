// models/Promo.js
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const promoSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },        // e.g., number of uses or tickets
    discount: { type: Number, required: true },      // e.g., 0.05 for 5% discount
    room_type: { type: String, required: true },     // e.g., "1003"
    date_active: { type: Date, required: true },
  },
  { timestamps: true }
);

export default models.Promo || model("Promo", promoSchema);
