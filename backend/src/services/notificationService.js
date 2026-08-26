/**
 * notificationService.js
 * Handles Web Push notifications via VAPID
 */
const webpush = require("web-push");
const { prisma } = require("../db");

// Configure VAPID details
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@smartfleet.local",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to all registered subscriptions
 */
async function sendPushNotification(title, body, data = {}) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("[PUSH] VAPID keys not configured, skipping notification.");
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany();

  if (subscriptions.length === 0) {
    console.log("[PUSH] No push subscriptions registered.");
    return;
  }

  const payload = JSON.stringify({ title, body, data });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        .catch(async (err) => {
          // Remove invalid/expired subscriptions
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(
              `[PUSH] Removing stale subscription: ${sub.id}`
            );
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
          }
          throw err;
        })
    )
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(
    `[PUSH] Sent notification "${title}" to ${succeeded}/${subscriptions.length} subscribers.`
  );
}

module.exports = { sendPushNotification };
