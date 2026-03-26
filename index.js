// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(express.json());

// Enable CORS for your frontend
app.use(cors({
    origin: "https://surv-ten.vercel.app" // your Vercel frontend
}));

// -------------------------------
// 1. Normalize Phone
// -------------------------------
app.post("/api/normalize-phone", (req, res) => {
    try {
        let { phone } = req.body;
        if (!phone) return res.status(400).json({ message: "Phone number is required" });

        phone = phone.replace(/\D/g, "");
        if (phone.startsWith("07")) phone = "254" + phone.substring(1);
        else if (phone.startsWith("7")) phone = "254" + phone;

        res.json({ normalized_phone: phone });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// -------------------------------
// 2. Initiate Payment (STK)
// -------------------------------
app.post("/api/initiate-payment", async (req, res) => {
    try {
        const { phone_number, amount, description } = req.body;
        if (!phone_number || !amount) {
            return res.status(400).json({ message: "phone_number and amount are required" });
        }
        const authHeader = process.env.PAYHERO_TOKEN;

        // Payload according to latest PayHero requirements
        const payload = {
            amount: Number(amount),
            phone_number: phone_number,
            channel_id: 4643,                       // your STK Push channel
            provider: "m-pesa",
            external_reference : "SUB-" + Date.now(), // unique reference
            callback_url: "https://TALAkash.online/callback",
            description: description || "Subscription Payment"
        };

        const response = await axios.post(
            "https://backend.payhero.co.ke/api/v2/payments",
            payload,
            { headers: { Authorization: authHeader, "Content-Type": "application/json" } }
        );

       res.json({
    ...response.data,
    reference: response.data.reference
});

        
    } catch (error) {
        console.error("PayHero payment error:", error.response?.data || error.message);
        res.status(400).json({
            message: "Payment initiation failed",
            error: error.response?.data || error.message
        });
    }
});

// -------------------------------
// 3. Verify Payment
// -------------------------------
// -------------------------------
// 3. Verify Payment
// -------------------------------
// In-memory store for completed transactions
const completedPayments = {}; // { external_reference: true }

// Callback endpoint that PayHero will call
app.post("/api/callback", (req, res) => {
    const data = req.body;
    console.log("PayHero callback received:", data);

    // Mark payment as completed
    if (data.reference && data.status === "COMPLETED") {
        completedPayments[data.reference] = true;
    }

    res.status(200).json({ received: true });
});





// Update verify-payment endpoint to check callback status
app.get("/api/verify-payment", async (req, res) => {
    try {
        const { external_reference } = req.query;
        if (!external_reference) return res.status(400).json({ message: "Transaction reference is required" });

        // Check if the transaction has been marked completed via callback
        const isCompleted = !!completedPayments[external_reference];

        res.json({
            external_reference,
            subscription_activated: isCompleted
        });

    } catch (error) {
        console.error("Verification error:", error.message);
        res.status(400).json({
            message: "Verification failed",
            error: error.message
        });
    }
});

// -------------------------------
// 4. Start Server
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
