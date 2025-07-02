// This file registers a service worker for push notifications

export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported');
    }
    // If already registered, return the registration
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) {
        return existing;
    }
    // Register and wait until active
    const registration = await navigator.serviceWorker.register('/sw.js');
    await new Promise((resolve, reject) => {
        if (registration.active) return resolve(true);
        const sw = registration.installing || registration.waiting;
        if (!sw) return reject('No service worker installing or waiting');
        sw.addEventListener('statechange', function listener() {
            if (sw.state === 'activated') {
                sw.removeEventListener('statechange', listener);
                resolve(true);
            }
        });
    });
    return registration;
}

export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// VAPID public key (replace with your own from backend)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// Convert base64 public key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Subscribe user to push notifications
export async function subscribeUserToPush() {
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.length < 80) {
        throw new Error('VAPID public key is missing or invalid. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY in your environment.');
    }
    const registration = await registerServiceWorker();
    if (!('PushManager' in window)) throw new Error('Push not supported');
    const permission = await requestNotificationPermission();
    if (!permission) throw new Error('Notification permission denied');
    // Check if already subscribed
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
        sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
    }
    // Send subscription to backend
    await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
    });
    return sub;
}

// Unsubscribe user from push notifications
export async function unsubscribeUserFromPush() {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
        await fetch('/api/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub),
        });
        await sub.unsubscribe();
    }
}
