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

        // Save to database if registration was successful
    if (response.data && response.data.orderId && !response.data.errorCode) {
      try {

        if (!payload.clientId) {
          throw new Error("clientId (userId) is required");
        }
        if (!payload.planId) { // Check for planId in payload, not req.body
          throw new Error("planId is required");
        }
        const payment = new Payment({
          mdOrder: response.data.orderId,
          userId: payload.clientId,
          orderNumber: payload.orderNumber,
          amount: payload.amount,
          planId: payload.planId,
          email: payload.email,
          fullName: payload.fullName,
          description: payload.description,
          status: "-1",
          formURL: response.data.formURL,
          bankResponse: response.data
        });

        const savedPayment = await payment.save();
        console.log("Payment saved to MongoDB:", savedPayment._id);
        
        // Optionally update user with current payment reference
        if (payload.clientId) {
          await Payment.findOneAndUpdate(
            { userId: payload.clientId },
            {
              $push: { paymentHistory: savedPayment._id },
              currentOrderId: response.data.orderId
            }
          );
        }
        
      } catch (dbError) {
        console.error("Error saving payment to database:", dbError);
        // Continue execution - don't fail the payment process due to DB issues
      }
    }

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
    const updatedPayment = await Payment.findOneAndUpdate(
      { mdOrder }, 
      { 
        operation, 
        status: status || null,
        callbackData: req.body,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedPayment) {
      console.error("Payment record not found for mdOrder:", mdOrder);
      return res.status(404).send("Payment not found");
    }

    // Update user based on payment result - use string userId
    if (status === "1") {
      await User.findOneAndUpdate( // Use findOneAndUpdate instead of findByIdAndUpdate
        { id: updatedPayment.userId }, // or whatever field matches your user ID
        {
          hasSelectedPlan: true,
          selectedPlan: updatedPayment.planId,
          currentOrderId: null
        }
      );
      console.log("User plan updated for successful payment");
    } else if (status === "0") {
      await User.findOneAndUpdate(
        { id: updatedPayment.userId },
        {
          currentOrderId: null,
        }
      );
      console.log("User order cleared for failed payment");
    }

    console.log("Payment updated successfully:", updatedPayment._id);
    res.send("OK");
  } catch (err) {
    console.error("Error saving payment:", err);
    res.status(500).send("DB Error");
  }
});

app.get("/api/payment", async (req, res) => {
  try {
    const { mdOrder } = req.query;
    console.log(mdOrder)

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
