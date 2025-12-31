import express from "express";
import path from "path";
import fs from "fs";
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
import Promo from "./models/Promo.js";
import crypto from "crypto";
import sendEmail from "./utils/sendEmail.js";
import processUserPaymentReminder from "./utils/processUserPaymentReminder.js"
import registrationEmailEN from "./emails/registration_en.js";
import registrationEmailES from "./emails/registration_es.js";
import { paymentConfirmationEN } from "./emails/paymentConfirmation.js";
import { paymentConfirmationES } from "./emails/paymentConfirmation.js";

const bankFields = [
  "userName",
  "password",
  "amount",
  "returnUrl",
  "description",
  "orderNumber",
  "dynamicCallbackUrl",
  "clientID",
  "email"
];

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // 👈 parse URL-encoded callbacks

connectDB();


// Proxy route to register payment
app.post("/api/register", async (req, res) => {
  try {
    // ----- 1. Merge in bank credentials -----
    const payload = {
      userName: process.env.PAYMENT_USERNAME,
      password: process.env.PAYMENT_PASSWORD,
      ...req.body,
    };

    console.log("Merged payload:", payload);

    // ----- 2. List of fields allowed by Belize Bank -----
    const bankFields = [
      "userName",
      "password",
      "amount",
      "returnUrl",
      "description",
      "orderNumber",
      "dynamicCallbackUrl",
      "clientID",   // must be capital ID
      "email",    // optional
    ];

    // ----- 3. Build bank payload only with whitelisted fields -----
    const bankPayload = {};

    bankFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== null) {
        bankPayload[field] = String(payload[field]);
      }
    });

    // Convert your internal clientId → bank clientID
    if (payload.clientId) {
      bankPayload.clientID = String(payload.clientId);
    }
    // if (payload.returnUrl) {
    //   bankPayload.returnURL = String(payload.returnUrl);
    // }

    // ----- 4. Build FormData manually with ONLY valid fields -----
    const formData = new FormData();
    Object.entries(bankPayload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Debug: Show exactly what is being sent
    console.log("Bank Payload Sent:", bankPayload);

    // ----- 5. Send request to Belize Bank -----
    const response = await axios.post(
      `${process.env.PAYMENT_URL}/register.do`,
      formData,
      { headers: formData.getHeaders() }
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
          reservationId: payload.reservationId,
          selectedRoom: payload.selectedRoom,
          locale: payload.locale,
        });
        
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

    // ------------------------------------------------------------------
    // SUCCESSFUL PAYMENT
    // ------------------------------------------------------------------
    if (status === "1") {

      // 1. Decrease promo usage
      if (updatedPayment.promoCode && updatedPayment.reservationId) {
        await Promo.findOneAndUpdate(
          {
            code: updatedPayment.promoCode,
            "reservations.id": updatedPayment.reservationId
          },
          {
            $set: { "reservations.$.status": "used" }
          }
        );
        console.log("Promo reservation marked as used");
      }

      // 2. Decrease room count + update availability
      const room = await Room.findOne({ id: updatedPayment.selectedRoom });

      if (room) {
        const newCount = Math.max(room.count - 1, 0);

        await Room.findOneAndUpdate(
          { id: updatedPayment.selectedRoom },
          {
            count: newCount,
            available: newCount > 0 ? "yes" : "no"
          }
        );

        console.log("Room count reduced. New count:", newCount);
      } else {
        console.log("Room not found for room id:", updatedPayment.selectedRoom);
      }

      // 3. Update user plan
      const user = await User.findOneAndUpdate(
        { email: updatedPayment.email },
        {
          hasSelectedPlan: true,
          selectedPlan: updatedPayment.planId,
          currentOrderId: null
        }
      );

      // 4. Send payment confirmation email
      if (user && room) {
        const locale = updatedPayment.locale || "en";
        const emailTemplate = locale === "es" 
          ? paymentConfirmationES(updatedPayment, user, room)
          : paymentConfirmationEN(updatedPayment, user, room);

        await sendEmail({ to: user.email, subject: emailTemplate.subject, html: emailTemplate.html, attachments: emailTemplate.attachments });
        console.log("Payment confirmation email sent.");
      }
    }

    // ------------------------------------------------------------------
    // FAILED PAYMENT
    // ------------------------------------------------------------------
    else if (status === "0") {
      await User.findOneAndUpdate(
        { email: updatedPayment.email },
        { currentOrderId: null }
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


app.post("/api/user", async (req, res) => {
  const { firstName, lastName, email, phone, countryCode, country, clubName, birthday, password, locale } = req.body;

  if (!firstName || !lastName || !email || !phone || !countryCode || !country || !clubName || !birthday || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      country,
      clubName,
      birthday,
      password: hashedPassword,
    });

    await newUser.save();

    // -----------------------------------------------------------
    // Select the correct email template
    // -----------------------------------------------------------
    const emailContent =
      locale === "es"
        ? registrationEmailES(firstName) // returns { subject, html }
        : registrationEmailEN(firstName);

    // -----------------------------------------------------------
    // Select correct PDF file
    // -----------------------------------------------------------
    console.log(locale)
    const pdfFilename = locale === "es"
      ? "LaConfe_Info_ES.pdf"
      : "LaConfe_Info_EN.pdf";

    const pdfPath = path.join(process.cwd(), "public", pdfFilename);
    
    // ✅ ADD: Verify the file exists before attempting to send
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found: ${pdfPath}`);
      return res.status(500).json({ message: "PDF file not found" });
    }

    console.log("PDF path:", pdfPath);
    console.log("PDF exists:", fs.existsSync(pdfPath));

    const allAttachments = [
      ...emailContent.attachments, // logo.png with cid
      {
        filename: pdfFilename,
        path: pdfPath,
        contentType: "application/pdf",
      },
    ];

    // ✅ Send email with combined attachments
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments: allAttachments,  // ← Explicitly pass as 'attachments'
    });

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

app.post("/api/auth/request-reset", async (req, res) => {
  const { email, locale } = req.body; // include locale

  if (!email) return res.status(400).json({ message: locale === "es" ? "Se requiere correo electrónico" : "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: locale === "es" ? "Se ha enviado un enlace de restablecimiento si la cuenta existe" : "Reset link sent if account exists" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 1000 * 60 * 15; // 15 min

    user.resetToken = token;
    user.resetTokenExpiry = expiresAt;
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/${locale}/reset-password?token=${token}`;

    // Prepare email based on locale
    const emailHtml = locale === "es"
      ? `
        <p>Has solicitado un restablecimiento de contraseña.</p>
        <p>Haz clic en el enlace para restablecerla:</p>
        <a href="${resetURL}">${resetURL}</a>
      `
      : `
        <p>You requested a password reset.</p>
        <p>Click below to reset:</p>
        <a href="${resetURL}">${resetURL}</a>
      `;

    await sendEmail({
      to: email,
      subject: locale === "es" ? "Solicitud de restablecimiento de contraseña" : "Password Reset Request",
      html: emailHtml,
    });

    return res.json({ message: locale === "es" ? "Se ha enviado un enlace de restablecimiento" : "Reset link sent" });

  } catch (err) {
    console.error("Error sending reset link:", err);
    return res.status(500).json({ message: locale === "es" ? "Error del servidor" : "Server error" });
  }
});


app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Password reset error:", err);
    return res.status(500).json({ message: "Server error" });
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

// Get next payment due for a user
app.get("/api/payments/next-due/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the first (earliest) successful payment for this user
    const firstPayment = await Payment.findOne({ userId, status: "1" }).sort({
      createdAt: 1,
    });

    if (!firstPayment) {
      return res
        .status(404)
        .json({ error: "No successful payments found for this user" });
    }

    // Get all successful payments count
    const successfulPaymentsCount = await Payment.countDocuments({
      userId,
      status: "1",
    });

    // You need plan installments (assuming planId is stored in payment)
    // For simplicity, store total installments in Payment or fetch from another collection
    const totalInstallments = Number(firstPayment.planId); // fallback to 3

    if (successfulPaymentsCount >= totalInstallments) {
      return res.json({ message: "All installments are already paid" });
    }

    // Anchor date = date of first payment
    const firstDate = new Date(firstPayment.createdAt);

    // Next installment index (0-based), so +1 for "next one"
    const nextInstallmentIndex = successfulPaymentsCount;

    // Calculate due date = last day of the month (firstDate + nextInstallmentIndex months)
    const nextDueDate = new Date(
      firstDate.getFullYear(),
      firstDate.getMonth() + 1 + nextInstallmentIndex,
      0 // day 0 → last day of previous month
    );

    res.json({
      nextDueDate: nextDueDate.toISOString().split("T")[0],
      installmentNumber: nextInstallmentIndex + 1,
      totalInstallments,
      remaining: totalInstallments - successfulPaymentsCount,
    });
  } catch (err) {
    console.error("Error calculating next due payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/payments/send-reminders", async (req, res) => {
  try {
    // Get users who have at least **1 successful payment**
    const usersWithPayments = await Payment.distinct("email", { status: "1" });

    if (usersWithPayments.length === 0) {
      return res.json({ message: "No users with active payments" });
    }

    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0–11

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    const isBeginning = day === 1;
    const isMiddle = day === 15;
    const isBeforeEnd = day === lastDayOfMonth - 2;

    // if (!isBeginning && !isMiddle && !isBeforeEnd) {
    //   return res.json({ message: "Not a reminder day – no emails sent." });
    // }

    let emailCount = 0;

    for (const email of usersWithPayments) {
      const user = await User.findOne({ email });
      if (!user) continue;

      // const sent = true

      const sent = await processUserPaymentReminder(user, { isBeginning, isMiddle, isBeforeEnd });
      if (sent) emailCount++;
    }

    res.json({
      message: "Reminder process executed",
      emailsSent: emailCount,
    });

  } catch (err) {
    console.error("Error sending reminders:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Get promo by code
app.get("/api/promo", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Promo code is required" });
    }

    const promo = await Promo.findOne({ code: code.toUpperCase() }); // make code case-insensitive

    if (!promo) {
      return res.status(404).json({ error: "Promo not found" });
    }

    res.json(promo);
  } catch (err) {
    console.error("Error retrieving promo:", err);
    res.status(500).json({ error: "Server error" });
  }
});

async function releaseExpiredReservation(code, reservationId) {
  return Promo.findOneAndUpdate(
    {
      code,
      "reservations.id": reservationId,
      "reservations.status": "reserved"
    },
    {
      $inc: { amount: 1 },
      $set: { "reservations.$.status": "expired" }
    }
  );
}

app.post("/api/promo/reserve", async (req, res) => {
  try {
    const { code, userId, roomType } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: "Code and userId are required" });
    }

    const now = new Date();
    const reservationId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Atomic operation: reserve promo if available
    const promo = await Promo.findOneAndUpdate(
      {
        code: code.toUpperCase(),
        amount: { $gt: 0 },
        date_active: { $lte: now },
        // Optionally verify room_type match
        ...(roomType && { $or: [{ room_type: String(roomType) }, { room_type: null }, { room_type: '' }] })
      },
      {
        $inc: { amount: -1 },
        $push: {
          reservations: {
            id: reservationId,
            userId: userId,
            timestamp: now,
            status: 'reserved'
          }
        }
      },
      { new: true }
    );

    if (!promo) {
      return res.status(404).json({ 
        error: "Promo unavailable",
        details: "Promo code is invalid, expired, out of stock, or not valid for selected room"
      });
    }

    // Set expiration cleanup (15 minutes)
    setTimeout(async () => {
      try {
        await releaseExpiredReservation(code.toUpperCase(), reservationId);
      } catch (err) {
        console.error("Failed to release expired reservation:", err);
      }
    }, 15 * 60 * 1000);

    res.json({
      success: true,
      reservationId,
      promo: {
        code: promo.code,
        discount: promo.discount,
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString()
      }
    });

  } catch (err) {
    console.error("Error reserving promo:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Dashboard API - get all registrants with full payment info
app.get("/api/dashboard/registrants", async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find({}).lean();

    // Fetch successful payments only
    const payments = await Payment.find({ status: "1" }).lean();

    // Fetch all rooms
    const rooms = await Room.find({}).lean();

    // Map rooms by ID for fast lookup
    const roomMap = {};
    rooms.forEach(r => {
      roomMap[r.id] = r;
    });

    // Group successful payments by userId
    const paymentsByUser = {};
    payments.forEach(p => {
      if (!paymentsByUser[p.userId]) paymentsByUser[p.userId] = [];
      paymentsByUser[p.userId].push(p);
    });

    const dashboardData = users.map(user => {
      const userId = user._id.toString();

      // All successful payments for this user
      const userPayments = paymentsByUser[userId] || [];

      // Sort by date to find first/last payments
      const sortedPayments = [...userPayments].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      const firstPayment = sortedPayments[0] || null;
      const lastPayment = sortedPayments[sortedPayments.length - 1] || null;

      // Resolve room (based on selectedRoom from firstPayment)
      let room = null;
      if (firstPayment?.selectedRoom && roomMap[firstPayment.selectedRoom]) {
        room = roomMap[firstPayment.selectedRoom];
      }

      const roomName = room?.name || null;
      const roomPrice = room?.price ?? null;

      const promoCode = firstPayment?.promoCode || null;

      // Full price (only from room)
      const fullPrice = roomPrice ?? null;

      // Apply 5% discount if a promo code exists
      const fullPriceAfterDiscount =
        promoCode && roomPrice
          ? Number((roomPrice * 0.95).toFixed(2))
          : null;

      // Total amount paid so far
      const totalPaid = userPayments.length
        ? userPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
        : null;

      // Age calculation
      const age = user.birthday
        ? Math.floor((Date.now() - new Date(user.birthday)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      return {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        country: user.country,
        club: user.clubName,
        age,

        roomName,
        paymentPlanId: firstPayment?.planId || null,
        numberOfPayments: userPayments.length || null,
        amountPaid: totalPaid,
        fullPrice,
        fullPriceAfterDiscount,
        promoCode,

        dateRegistered: user.createdAt || null,
        firstPaymentDate: firstPayment?.createdAt || null,
        lastPaymentDate: lastPayment?.createdAt || null,
      };
    });

    res.json({ success: true, data: dashboardData });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});




const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
