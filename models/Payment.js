const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  mdOrder: {
    type: String,
    required: true,
    unique: true, // Ensure no duplicate orders
    index: true // For faster queries
  },
  userId: {
    type: String,
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  formURL: {
    type: String
  },
  bankResponse: {
    type: mongoose.Schema.Types.Mixed // Store full bank response
  },
  callbackData: {
    type: mongoose.Schema.Types.Mixed // Store callback data when received
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for efficient querying
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ mdOrder: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
