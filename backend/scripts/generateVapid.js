/**
 * Run this once to generate VAPID keys for Web Push notifications.
 * Copy the output into your .env file.
 */
const webpush = require("web-push");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("=== VAPID Keys Generated ===");
console.log("Add these to your .env file:\n");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
