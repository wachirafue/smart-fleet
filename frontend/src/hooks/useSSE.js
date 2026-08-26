/**
 * src/hooks/useSSE.js
 * Custom hook to subscribe to Server-Sent Events from the backend
 */
"use client";
import { useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../lib/api";

/**
 * useSSE - Subscribe to the backend SSE stream
 * @param {Object} handlers - Event handler map { eventName: callbackFn }
 */
export function useSSE(handlers) {
  const eventSourceRef = useRef(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref up to date without re-triggering effect
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const url = `${API_BASE}/api/sse`;
    console.log("[SSE] Connecting to:", url);

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("connected", (e) => {
      console.log("[SSE] Connected:", e.data);
    });

    // Attach named event listeners
    const attachedEvents = [];
    for (const [eventName] of Object.entries(handlersRef.current || {})) {
      const listener = (e) => {
        try {
          const data = JSON.parse(e.data);
          handlersRef.current?.[eventName]?.(data);
        } catch {}
      };
      es.addEventListener(eventName, listener);
      attachedEvents.push([eventName, listener]);
    }

    es.onerror = (err) => {
      console.warn("[SSE] Connection error, will auto-reconnect...", err);
    };

    return () => {
      for (const [name, fn] of attachedEvents) {
        es.removeEventListener(name, fn);
      }
      es.close();
      console.log("[SSE] Disconnected.");
    };
  }, []); // Only run once on mount
}

/**
 * usePushNotifications - Set up Web Push subscriptions
 */
export function usePushNotifications() {
  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[PUSH] Push notifications not supported.");
      return;
    }

    try {
      const { getVapidPublicKey, savePushSubscription } = await import("../lib/api");
      const { publicKey } = await getVapidPublicKey();

      if (!publicKey || publicKey === "your_vapid_public_key_here") {
        console.warn("[PUSH] VAPID public key not configured on backend.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await savePushSubscription(existing.toJSON());
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await savePushSubscription(subscription.toJSON());
      console.log("[PUSH] Push subscription registered.");
    } catch (err) {
      console.error("[PUSH] Subscription failed:", err.message);
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Service worker registered:", reg.scope);
          // Request notification permission
          if (Notification.permission === "default") {
            Notification.requestPermission().then((perm) => {
              if (perm === "granted") subscribe();
            });
          } else if (Notification.permission === "granted") {
            subscribe();
          }
        })
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, [subscribe]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
