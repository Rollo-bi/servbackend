const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

/* -------------------------------
   1. Normalize Phone
--------------------------------*/
app.post("/normalize-phone", (req, res) => {
    let { phone } = req.body;

    phone = phone.replace(/\D/g, "");

    if (phone.startsWith("07")) {
        phone = "254" + phone.substring(1);
    }

    if (phone.startsWith("7")) {
        phone = "254" + phone;
    }

    res.json({ normalized_phone: phone });
});


/* -------------------------------
   2. Initiate Payment (STK)
--------------------------------*/
app.post("/initiate-payment", async (req, res) => {
    try {
        const { phone_number, amount, description } = req.body;

        const response = await axios.post(
            "https://backend.payhero.co.ke/api/v2/payments",
            {
                phone_number,
                amount,
                description
            },
            {
                headers: {
                    Authorization: "Basic YOUR_TOKEN",
                    "Content-Type": "application/json"
                }
            }
        );

        res.json(response.data);

    } catch (error) {
        res.status(400).json({
            message: "Payment initiation failed"
        });
    }
});


/* -------------------------------
   3. Verify Payment
--------------------------------*/
app.get("/verify-payment", async (req, res) => {
    try {
        const { reference } = req.query;

        const response = await axios.get(
            `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${reference}`,
            {
                headers: {
                    Authorization: "Basic YOUR_TOKEN"
                }
            }
        );

        res.json(response.data);

    } catch {
        res.status(400).json({
            message: "Verification failed"
        });
    }
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});
