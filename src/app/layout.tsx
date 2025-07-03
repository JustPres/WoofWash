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

function Background() {
  const [timeOfDay, setTimeOfDay] = useState('morning');
  useEffect(() => {
    const getTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) return 'morning';
      if (hour >= 11 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 20) return 'evening';
      return 'night';
    };
    setTimeOfDay(getTimeOfDay());
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const bgClass = {
    morning: 'bg-gradient-to-b from-sky-200 via-yellow-100 to-white',
    afternoon: 'bg-gradient-to-b from-sky-300 via-sky-100 to-white',
    evening: 'bg-gradient-to-b from-indigo-400 via-pink-200 to-yellow-100',
    night: 'bg-gradient-to-b from-blue-900 via-slate-800 to-black',
  }[timeOfDay];
  return (
    <div className={`fixed inset-0 -z-10 w-full h-full transition-colors duration-1000 ${bgClass}`}>
      {timeOfDay === 'morning' && (
        <>
          <div className="absolute top-20 left-0 w-48 h-16 bg-white/70 rounded-full blur-md animate-cloud-move z-0" />
          <div className="absolute top-32 left-1/3 w-32 h-12 bg-white/60 rounded-full blur-sm animate-cloud-move z-0" style={{ animationDuration: '60s', animationDelay: '10s' }} />
        </>
      )}
      {(timeOfDay === 'evening' || timeOfDay === 'night') && (
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          {[...Array(40)].map((_, i) => {
            const isPaw = i % 6 === 0; // 1 in 6 stars is a paw print
            const size = Math.random() * 2 + 1;
            const style = {
              width: `${size * (isPaw ? 8 : 2)}px`,
              height: `${size * (isPaw ? 8 : 2)}px`,
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 98}%`,
              animationDuration: timeOfDay === 'evening' ? '6s' : '3.5s',
              animationDelay: `${Math.random() * 2}s`,
            };
            return isPaw ? (
              <img
                key={i}
                src="/paw-star.svg"
                alt="paw star"
                className={`absolute animate-star-twinkle2`}
                style={style}
                draggable={false}
              />
            ) : (
              <div
                key={i}
                className={`absolute bg-white rounded-full animate-star-twinkle`}
                style={style}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative`}
      >
        <Background />
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
