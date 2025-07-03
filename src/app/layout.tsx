"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import { LanguageContext } from "@/context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [lang, setLang] = useState("en");
  const [showLangAlert, setShowLangAlert] = useState(false);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (stored) {
      setLang(stored);
    } else if (typeof window !== "undefined") {
      // Detect browser language on first visit
      const browserLang = navigator.language.slice(0, 2);
      let detected = "en";
      if (browserLang === "ja") detected = "ja";
      else if (["tl", "fil", "ph"].includes(browserLang)) detected = "fil";
      if (detected !== "en") {
        setLang(detected);
        setShowLangAlert(true);
        localStorage.setItem("lang", detected);
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <html lang={lang}>
      <head>
        <title>WeatherShower: Dog Bath Schedule App</title>
        <meta name="description" content="Personalized dog bath schedules based on local weather. Keep your dog clean and healthy with WeatherShower!" />
        <meta property="og:title" content="WeatherShower: Dog Bath Schedule App" />
        <meta property="og:description" content="Personalized dog bath schedules based on local weather. Keep your dog clean and healthy with WeatherShower!" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="WeatherShower: Dog Bath Schedule App" />
        <meta name="twitter:description" content="Personalized dog bath schedules based on local weather. Keep your dog clean and healthy with WeatherShower!" />
        <meta name="twitter:image" content="/icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/dog-weather-favicon.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <meta name="theme-color" content="#f3f4f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WeatherShower" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {showLangAlert && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-700 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in">
            {lang === "ja" && "言語が日本語に自動設定されました。右上の言語ピッカーで変更できます。"}
            {lang === "fil" && "Wika ay awtomatikong itinakda sa Filipino. Maaari mo itong baguhin sa language picker."}
            {lang === "en" && "Language set to English. You can change it anytime from the picker."}
            <button className="ml-4 underline" onClick={() => setShowLangAlert(false)}>OK</button>
          </div>
        )}
        <LanguageContext.Provider value={{ lang, setLang }}>
          {children}
        </LanguageContext.Provider>
      </body>
    </html>
  );
}
