/**
 * routes/subscribe.js
 * POST /api/subscribe - Register a Web Push subscription
 */
const express = require("express");
const { prisma } = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, error: "Invalid subscription object." });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    console.log("[PUSH] New push subscription registered.");
    res.status(201).json({ success: true, message: "Subscription saved." });
  } catch (err) {
    console.error("[API] POST /subscribe error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET VAPID public key for frontend to use
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
});

module.exports = router;
