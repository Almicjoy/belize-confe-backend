import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import FormData from "form-data";
import { connectDB } from "./db.js";
import Payment from "./models/Payment.js";
import User from "./models/User.js";  
import Room from "./models/Room.js";

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
        const savedPayment = await Payment.create({
          mdOrder: response.data.orderId,
          userId: payload.clientId,
          orderNumber: payload.orderNumber,
          amount: payload.amount,
          planId: payload.planId,
          email: payload.email,
          fullName: payload.fullName,
          description: payload.description,
          status: "-1",
          paymentNumber: payload.paymentNumber,
          formURL: response.data.formURL,
          bankResponse: response.data,
          promoCode: payload.promoCode,
          selectedRoom: payload.selectedRoom
        });

        if (payload.selectedRoom) {
          // Find by room name instead of ID
          const room = await Room.findOne({ id: payload.selectedRoom });
          if (room) {
            room.available = Math.max(0, (room.available || 0) - 1); // avoid negative values
            await room.save();
            console.log(`Room ${room.name} availability decreased to ${room.available}`);
          } else {
            console.warn(`Room with name "${payload.selectedRoom}" not found.`);
          }
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
      await Payment.findOneAndUpdate( // Use findOneAndUpdate instead of findByIdAndUpdate
        { id: updatedPayment.userId }, // or whatever field matches your user ID
        {
          hasSelectedPlan: true,
          selectedPlan: updatedPayment.planId,
          currentOrderId: null
        }
      );
      console.log("User plan updated for successful payment");
    } else if (status === "0") {
      await Payment.findOneAndUpdate(
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

app.get("/api/user-payment", async (req, res) => {
  try {
    const email = req.query.email; // get email from query string

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find payments for this email
    const payments = await Payment.find({ email });

    res.json({ payments });
  } catch (err) {
    console.error("Error fetching user payments:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Register user endpoint
app.post("/api/user", async (req, res) => {
  const { firstName, lastName, email, country, clubName, birthday, password } = req.body;

  // Validate input
  if (!firstName || !lastName || !email || !country || !clubName || !birthday || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const newUser = new User({
      firstName,
      lastName,
      email,
      country,
      clubName,
      birthday,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "1h" }
    );

    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      country: user.country || "",
      clubName: user.clubName || "",
      hasSelectedPlan: user.hasSelectedPlan || false,
      selectedPlan: user.selectedPlan || "",
      token
    };

    console.log("Sending user data:", userData); // DEBUG LOG
    res.json(userData);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ success: false, error: "Failed to fetch rooms" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
