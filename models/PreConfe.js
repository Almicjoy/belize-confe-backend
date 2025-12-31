import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const preConferenceSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    activityList: [{ type: String, required: true }], // Array of activities
    inclusions: [{ type: String, required: true }], // What's included
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "9:00 AM - 5:00 PM"
    destination: { type: String, required: true },
    maxPersons: { type: Number, required: true }, // Cap on number of persons
    currentBookings: { type: Number, default: 0 }, // Track current bookings
    isActive: { type: Boolean, default: true }, // Can be disabled
    imageUrl: { type: String }, // Optional image
    description: { type: String }, // Additional description
  },
  { timestamps: true }
);

export default models.PreConfe || model("PreConference", preConferenceSchema);