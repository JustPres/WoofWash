// This file registers a service worker for push notifications
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(
                registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                },
                err => {
                    console.error('Service Worker registration failed:', err);
                }
            );
        });
    }
}

export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}
