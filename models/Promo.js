// models/Promo.js
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const promoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  discount: { type: Number, required: true },
  room_type: { type: String },
  date_active: { type: Date },
  reservations: [
    {
      id: { type: String, required: true },
      userId: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      status: { type: String, enum: ['reserved', 'used', 'expired'], default: 'reserved' }
    }
  ]
}, { timestamps: true });

export default models.Promo || model("Promo", promoSchema);
