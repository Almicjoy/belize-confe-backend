// models/Payment.js
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    mdOrder: { type: String, required: true },
    orderNumber: { type: String, required: true },
    operation: { type: String, required: true },
    status: { type: String, required: true }, // status=1 = success
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);
