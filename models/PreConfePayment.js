import mongoose from "mongoose";

const PreConfePaymentSchema = new mongoose.Schema({
  mdOrder: { type: String },
  userId: { type: String, required: true },
  orderNumber: { type: String },
  amount: { type: Number },
  preconfeIds: [{ type: Number }],
  email: { type: String },
  fullName: { type: String },
  description: { type: String },
  status: { type: String, default: "-1" },
  formURL: { type: String },
  bankResponse: { type: Object },
  locale: { type: String },
}, { timestamps: true });

export default mongoose.model("PreConfePayment", PreConfePaymentSchema);