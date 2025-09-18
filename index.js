import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import { connectDB } from "./db.js";
import Payment from "./models/Payment.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // 👈 parse URL-encoded callbacks

connectDB();


// Proxy route to register payment
app.post("/api/register", async (req, res) => {
  try {
    const payload = {
      userName: process.env.PAYMENT_USERNAME,
      password: process.env.PAYMENT_PASSWORD,
      ...req.body,
    };

    console.log("Merged payload:", payload);

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });

    const response = await axios.post(
      "https://sandbox.belizebank.com/payment/rest/register.do",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    res.json({
      sentPayload: payload,
      bankResponse: response.data,
    });
  } catch (error) {
    console.error("Error proxying request:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment request failed" });
  }
});

// Bank CALLBACK endpoint
app.post("/api/payment/callback", async (req, res) => {
  const { mdOrder, orderNumber, operation, status } = req.body;
  console.log("Bank callback:", req.body);

  try {
    // Save or update payment record
    await Payment.findOneAndUpdate(
      { mdOrder }, // lookup by orderNumber
      { mdOrder, operation, status, orderNumber },
      { upsert: true, new: true }
    );

    res.send("OK");
  } catch (err) {
    console.error("Error saving payment:", err);
    res.status(500).send("DB Error");
  }
});

app.get("/api/payment/:orderNumber", async (req, res) => {
  try {
    const { mdOrder } = req.params;

    const payment = await Payment.findOne({ mdOrder });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (err) {
    console.error("Error retrieving payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
