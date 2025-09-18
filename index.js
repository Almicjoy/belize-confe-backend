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
        const payment = new Payment({
          mdOrder: response.data.orderId,
          userId: payload.clientId, // This should be a valid MongoDB ObjectId
          orderNumber: payload.orderNumber,
          amount: payload.amount,
          planId: req.body.planId,
          email: payload.email,
          fullName: payload.fullName,
          description: payload.description,
          status: null,
          formURL: response.data.formURL,
          bankResponse: response.data
        });

        const savedPayment = await payment.save();
        console.log("Payment saved to MongoDB:", savedPayment._id);
        
        // Optionally update user with current payment reference
        if (payload.clientId) {
          await User.findByIdAndUpdate(payload.clientId, {
            $push: { paymentHistory: savedPayment._id },
            currentOrderId: response.data.orderId
          });
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
    // Update only the callback-specific fields, preserve existing data
    const updatedPayment = await Payment.findOneAndUpdate(
      { mdOrder }, 
      { 
        operation, 
        status: status || null, // Use status from callback, null if empty/undefined
        callbackData: req.body, // Store full callback data
        updatedAt: new Date(),
        orderNumber
      },
      { new: true } // Remove upsert to ensure record exists
    );

    if (!updatedPayment) {
      console.error("Payment record not found for mdOrder:", mdOrder);
      return res.status(404).send("Payment not found");
    }

    // Update user based on payment result
    if (status === "1") {
      // Successful payment
      await User.findByIdAndUpdate(updatedPayment.userId, {
        hasSelectedPlan: true,
        selectedPlan: updatedPayment.planId,
        currentOrderId: null
      });
      console.log("User plan updated for successful payment");
    } else if (status === "0") {
      // Failed payment - clear any pending order, don't activate plan
      await User.findByIdAndUpdate(updatedPayment.userId, {
        currentOrderId: null,
        // Keep hasSelectedPlan and selectedPlan unchanged (false/null)
      });
      console.log("User order cleared for failed payment");
    }
    // If status is blank/null/undefined, it's still pending - do nothing to user

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
