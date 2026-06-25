/**
 * ResQ Web Push Notification Service
 * Registers the Service Worker, subscribes the user, and keeps the subscription synced with the backend.
 */

const VAPID_PUBLIC_KEY = 'BKIR78kw4trsF3OhEWo5s_ffh0euwPrJ8OcUGUq21AgjVW3YWwcz2wHkyCYTtPe7o28xtyjb-O7CoRdCvZUUsuY';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Push notifications not supported in this browser.');
    return;
  }

  try {
    // 1. Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] Service Worker registered:', registration.scope);

    // 2. Check permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied.');
      return;
    }

    // 3. Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 4. Subscribe to push manager
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('[Push] New subscription created.');
    } else {
      console.log('[Push] Already subscribed.');
    }

    // 5. Send subscription to backend
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch('http://localhost:5000/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    if (response.ok) {
      console.log('[Push] Subscription saved to backend successfully.');
    } else {
      console.error('[Push] Failed to save subscription to backend:', await response.text());
    }

    return subscription;
  } catch (err) {
    console.error('[Push] Error initializing push notifications:', err);
  }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await subscription.unsubscribe();

    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch('http://localhost:5000/api/push/unsubscribe', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    console.log('[Push] Unsubscribed from push notifications.');
  } catch (err) {
    console.error('[Push] Error unsubscribing:', err);
  }
}
