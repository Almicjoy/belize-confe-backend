import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // 👈 parse URL-encoded callbacks

// Temporary in-memory "database" for demo
const users = [
  {
    email: "test@example.com",
    firstName: "Alessa",
    lastName: "Castillo",
    hasSelectedPlan: false,
    selectedPlan: null,
  },
];

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

// Callback endpoint: bank calls this
app.post("/api/payment/callback", (req, res) => {
  // Bank callback comes as URL-encoded form data
  const { mdOrder, orderNumber, operation, status } = req.body;
  console.log("Payment Callback from Bank:", req.body);

  // Example: find user by orderNumber (you may map orders to users in DB)
  const user = users.find(u => u.email === req.body.email); // OR your order-user mapping
  const planId = req.body.plan || 1; // you can pass this from frontend as dynamicCallbackUrl param

  if (!user) {
    console.warn("User not found for callback!");
    return res.status(404).send("User not found");
  }

  let redirectUrl = "https://la-confe-bz.vercel.app/en/dashboard";

  if (status === "1") {
    // Payment success
    user.hasSelectedPlan = true;
    user.selectedPlan = planId;

    // Redirect with success query params
    redirectUrl += `?status=success&plan=${encodeURIComponent(planName)}&orderId=${mdOrder}&orderNumber=${orderNumber}`;
  } else {
    // Payment failure
    const errorMsg = req.body.errorMessage || "Payment failed";
    redirectUrl += `?status=failure&error=${encodeURIComponent(errorMsg)}`;
  }

  // Redirect the user back to the dashboard
  res.redirect(302, redirectUrl);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
