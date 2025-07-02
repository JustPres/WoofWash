"use client";
import { useState } from "react";

export default function SettingsPage() {
  // Placeholder settings state
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-sky-50 p-4">
      <h1 className="text-2xl font-bold mb-6 text-sky-900 animate-fade-in">Settings</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sky-800">Enable Notifications</span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications((n) => !n)}
            className="accent-sky-600 w-5 h-5"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sky-800">Theme</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="rounded px-2 py-1 border border-sky-300 bg-white text-sky-900 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sky-800">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded px-2 py-1 border border-sky-300 bg-white text-sky-900 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="en">English</option>
            <option value="fil">Filipino</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </div>
    </main>
  );
}
