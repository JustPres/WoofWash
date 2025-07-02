"use client";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { registerServiceWorker } from "@/utils/notifications";
import Image from "next/image";
import type { WeatherData } from "@/types/weather";

const translations: Record<string, Record<string, string>> = {
    en: {
        selectDog: "Select Dog:",
        remove: "Remove",
        addDog: "+ Add Dog",
        weeklyBath: "Weekly Bath Schedule",
        for: "For:",
        city: "City:",
        country: "Country:",
        lastUpdated: "Last updated:",
        loadingWeather: "Loading weather...",
        noDogs: "No dogs found",
        addDogInfo: "To view your dog’s bath schedule, please add your dog’s information first.",
        editDog: "Edit Dog Info",
        home: "Home",
        enableNotif: "🔕 Enable Notifications",
        notifEnabled: "🔔 Enabled",
        refreshWeather: "⟳ Refresh Weather",
        removeDogConfirm: "Remove",
        notSet: "Not set",
        whyBest: "Best for dog baths: warm and dry.",
        whyOk: "Okay for baths: not rainy.",
        whyNo: "Not recommended: wet or rainy.",
        debug: "Debug/Logs:",
    },
    fil: {
        selectDog: "Pumili ng Aso:",
        remove: "Tanggalin",
        addDog: "+ Magdagdag ng Aso",
        weeklyBath: "Lingguhang Iskedyul ng Paliligo",
        for: "Para kay:",
        city: "Lungsod:",
        country: "Bansa:",
        lastUpdated: "Huling update:",
        loadingWeather: "Ikinakarga ang panahon...",
        noDogs: "Walang asong natagpuan",
        addDogInfo: "Upang makita ang iskedyul ng paliligo, magdagdag muna ng impormasyon ng iyong aso.",
        editDog: "I-edit ang Impormasyon ng Aso",
        home: "Home",
        enableNotif: "🔕 I-enable ang Notipikasyon",
        notifEnabled: "🔔 Naka-enable",
        refreshWeather: "⟳ I-refresh ang Panahon",
        removeDogConfirm: "Tanggalin",
        notSet: "Hindi nakalagay",
        whyBest: "Pinakamainam para sa paliligo: mainit at tuyo.",
        whyOk: "Pwede para sa paliligo: hindi maulan.",
        whyNo: "Hindi inirerekomenda: basa o maulan.",
        debug: "Debug/Logs:",
    },
    ja: {
        selectDog: "犬を選択:",
        remove: "削除",
        addDog: "+ 犬を追加",
        weeklyBath: "週間入浴スケジュール",
        for: "対象:",
        city: "都市:",
        country: "国:",
        lastUpdated: "最終更新:",
        loadingWeather: "天気を読み込み中...",
        noDogs: "犬が見つかりません",
        addDogInfo: "犬の入浴スケジュールを見るには、まず犬の情報を追加してください。",
        editDog: "犬の情報を編集",
        home: "ホーム",
        enableNotif: "🔕 通知を有効化",
        notifEnabled: "🔔 有効化済み",
        refreshWeather: "⟳ 天気を更新",
        removeDogConfirm: "削除",
        notSet: "未設定",
        whyBest: "入浴に最適：暖かく乾燥。",
        whyOk: "入浴OK：雨でない。",
        whyNo: "おすすめしません：雨や湿気。",
        debug: "デバッグ/ログ:",
    },
};





async function fetchLatLon(city: string, country: string) {
    // Use Open-Meteo's geocoding API
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json&country=${country}`);
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    if (!data.results || !data.results.length) throw new Error("City not found");
    return { lat: data.results[0].latitude, lon: data.results[0].longitude };
}

async function fetchWeather(city: string, country: string) {
    try {
        const { lat, lon } = await fetchLatLon(city, country);
        // Fetch current, daily, and hourly weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&hourly=temperature_2m,precipitation&timezone=auto`);
        if (!weatherRes.ok) throw new Error("Weather fetch failed");
        return weatherRes.json();
    } catch {
        throw new Error("Could not fetch weather for " + city);
    }
}



export default function Schedule() {
    const { lang } = useContext(LanguageContext);
    const t = translations[lang] || translations.en;

    const [dogs, setDogs] = useState<Array<{ name: string, breed?: string, origin?: string, furType?: string, country?: string, photo?: string, bathTimePref?: string }>>([]);
    const [selectedDogIdx, setSelectedDogIdx] = useState<number>(0);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [city, setCity] = useState<string>("");
    const [country, setCountry] = useState<string>("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [error, setError] = useState<string>("");
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [notifEnabled, setNotifEnabled] = useState(false);

    // Time of day for animated background
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');



    useEffect(() => {
        registerServiceWorker();
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotifEnabled(Notification.permission === 'granted');
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("dogs");
            const selectedIdx = localStorage.getItem("selectedDogIdx");
            let cityFromOrigin = "";
            if (stored) {
                const parsed = JSON.parse(stored);
                setDogs(parsed);
                // Use selectedDogIdx if present, else default to 0
                let idx = 0;
                if (selectedIdx && !isNaN(Number(selectedIdx)) && parsed.length > Number(selectedIdx)) {
                    idx = Number(selectedIdx);
                    setSelectedDogIdx(idx);
                }
                // Use the selected dog's origin as city
                if (parsed[idx] && parsed[idx].origin) {
                    cityFromOrigin = parsed[idx].origin.split(",")[0].trim();
                    setCity(cityFromOrigin);
                }
                // Use the selected dog's country
                if (parsed[idx] && parsed[idx].country) {
                    setCountry(parsed[idx].country);
                }
            }
            // Do NOT remove selectedDogIdx after use; keep it persistent
            // if (cityFromOrigin && country) {
            if (cityFromOrigin && country) {
                setLogs(l => [...l, `Fetching weather for ${cityFromOrigin}, ${country}`]);
                fetchWeather(cityFromOrigin, country)
                    .then(data => {
                        setWeather(data);
                        setLastUpdated(new Date().toLocaleString());
                        setLogs(l => [...l, `Weather fetch success at ${new Date().toLocaleTimeString()}`]);
                    })
                    .catch((e) => {
                        setError(e.message);
                        setLogs(l => [...l, `Weather fetch error: ${e.message}`]);
                    });
            }
        }
    }, []);

    // Fetch weather when selected dog changes
    useEffect(() => {
        if (dogs.length > 0 && typeof window !== "undefined") {
            const dog = dogs[selectedDogIdx] || dogs[0];
            const city = dog.origin ? dog.origin.split(",")[0].trim() : "";
            const country = dog.country || "";
            setCity(city);
            setCountry(country);
            if (city && country) {
                setLogs(l => [...l, `Fetching weather for ${city}, ${country} (dog picker)`]);
                fetchWeather(city, country)
                    .then(data => {
                        setWeather(data);
                        setLastUpdated(new Date().toLocaleString());
                        setLogs(l => [...l, `Weather fetch success at ${new Date().toLocaleTimeString()}`]);
                    })
                    .catch((e) => {
                        setError(e.message);
                        setLogs(l => [...l, `Weather fetch error: ${e.message}`]);
                    });
            }
        }
    }, [selectedDogIdx]);

    // Auto-refresh weather every 5 minutes
    useEffect(() => {
        if (!city || !country) return;
        const interval = setInterval(() => {
            fetchWeather(city, country)
                .then(data => {
                    setWeather(data);
                    setLastUpdated(new Date().toLocaleString());
                    setLogs(l => [...l, `Auto weather refresh at ${new Date().toLocaleTimeString()}`]);
                })
                .catch((e) => {
                    setError(e.message);
                    setLogs(l => [...l, `Auto weather refresh error: ${e.message}`]);
                });
        }, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, [city, country]);

    // On mount or refresh, fetch weather after 2 seconds
    useEffect(() => {
        if (!city || !country) return;
        const timeout = setTimeout(() => {
            setLogs(l => [...l, `Initial delayed weather fetch for ${city}, ${country}`]);
            fetchWeather(city, country)
                .then(data => {
                    setWeather(data);
                    setLastUpdated(new Date().toLocaleString());
                    setLogs(l => [...l, `Initial delayed weather fetch success at ${new Date().toLocaleTimeString()}`]);
                })
                .catch((e) => {
                    setError(e.message);
                    setLogs(l => [...l, `Initial delayed weather fetch error: ${e.message}`]);
                });
        }, 2000);
        return () => clearTimeout(timeout);
    }, [city, country]);

    // Time of day for animated background
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

    const handleDogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const idx = Number(e.target.value);
        setSelectedDogIdx(idx);
        if (typeof window !== "undefined") {
            localStorage.setItem("selectedDogIdx", String(idx));
        }
    };




    // Remove selected dog
    const handleRemoveDog = () => {
        if (dogs.length <= 1) return;
        if (confirm(`${t.removeDogConfirm} ${dogs[selectedDogIdx].name}?`)) {
            const updatedDogs = dogs.filter((_, i) => i !== selectedDogIdx);
            setDogs(updatedDogs);
            localStorage.setItem("dogs", JSON.stringify(updatedDogs));
            setSelectedDogIdx(0);
        }
    };

    // Add a refresh handler
    const handleRefreshWeather = async () => {
        setError("");
        setLogs(l => [...l, "Manual weather refresh triggered"]);
        if (city && country) {
            try {
                const data = await fetchWeather(city, country);
                setWeather(data);
                setLastUpdated(new Date().toLocaleString());
                setLogs(l => [...l, `Weather refresh success at ${new Date().toLocaleTimeString()}`]);
            } catch (e) {
                if (e instanceof Error) {
                    setError(e.message);
                    setLogs(l => [...l, `Weather refresh error: ${e.message}`]);
                } else {
                    setError("Unknown error");
                    setLogs(l => [...l, "Weather refresh error: Unknown error"]);
                }
            }
        }
    };

    // Remove Vanta.js/three.js code and use a CSS/Tailwind animated background
    // Dynamic background classes based on time of day
    const bgClass = {
        morning: 'bg-gradient-to-b from-sky-200 via-yellow-100 to-white',
        afternoon: 'bg-gradient-to-b from-sky-300 via-sky-100 to-white',
        evening: 'bg-gradient-to-b from-indigo-400 via-pink-200 to-yellow-100',
        night: 'bg-gradient-to-b from-blue-900 via-slate-800 to-black',
    }[timeOfDay];

    // Animated overlays for sun/moon at top left, clouds, stars
    // Add these keyframes to your global CSS or Tailwind config (see bottom of file for details)

    // For smooth transition between backgrounds, animate the background gradient


    // Determine sunrise/sunset from weather data or use defaults


    return (
        <main className={`min-h-screen w-full flex flex-col items-center justify-center p-0 relative overflow-hidden transition-colors duration-1000 ${bgClass}`}>
            {/* Animated overlays: clouds for morning, stars for evening/night */}
            {timeOfDay === 'morning' && (
                <>
                    <div className="absolute top-20 left-0 w-48 h-16 bg-white/70 rounded-full blur-md animate-cloud-move z-0" />
                    <div className="absolute top-32 left-1/3 w-32 h-12 bg-white/60 rounded-full blur-sm animate-cloud-move z-0" style={{ animationDuration: '60s', animationDelay: '10s' }} />
                </>
            )}
            {(timeOfDay === 'evening' || timeOfDay === 'night') && (
                <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className={`absolute bg-white rounded-full ${i % 2 === 0 ? 'animate-star-twinkle' : 'animate-star-twinkle2'}`} style={{
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            top: `${Math.random() * 90}%`,
                            left: `${Math.random() * 98}%`,
                            animationDuration: timeOfDay === 'evening' ? '6s' : '3.5s',
                            animationDelay: `${Math.random() * 2}s`,
                        }} />
                    ))}
                </div>
            )}
            {/* Main content wrapper (above overlays) */}
            <div className="w-full min-h-screen flex flex-col items-center justify-center relative z-20">
                {/* Dog picker card */}
                {dogs.length > 0 && (
                    <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-between bg-white/60 backdrop-blur rounded-xl shadow border border-white/30 p-2 sm:p-4 mb-6 mt-8 gap-3 sm:gap-2">
                        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-2 sm:gap-2">
                            <span className="text-2xl">🐶</span>
                            <label htmlFor="dog-picker" className="text-black font-bold text-lg w-full sm:w-auto text-center sm:text-left">{t.selectDog}</label>
                            <select
                                id="dog-picker"
                                value={selectedDogIdx}
                                onChange={handleDogChange}
                                className="rounded px-2 py-1 border border-sky-300 bg-white/80 text-sky-900 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm sm:text-base w-full sm:w-auto"
                            >
                                {dogs.map((d, i) => (
                                    <option key={i} value={i}>{d.name}</option>
                                ))}
                            </select>
                            {dogs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleRemoveDog}
                                    className="w-full sm:w-auto px-3 py-1 flex items-center justify-center rounded bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 font-semibold text-xs shadow mt-2 sm:mt-0"
                                    title={t.remove}
                                >
                                    {t.remove}
                                </button>
                            )}
                        </div>
                        <Link href="/onboarding" className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-1 bg-sky-200 text-sky-900 rounded hover:bg-sky-300 font-semibold shadow border border-sky-300 text-center">{t.addDog}</Link>
                    </div>
                )}
                <div className="w-full max-w-4xl min-h-[80vh] bg-white/40 backdrop-blur-md rounded-none sm:rounded-2xl shadow-2xl p-2 sm:p-12 border border-white/30 flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-sky-900 drop-shadow text-center">{t.weeklyBath}</h2>
                    {/* Show selected dog name if available */}
                    {dogs.length > 0 && dogs[selectedDogIdx] && weather && (
                        <div className="mb-4 w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-center sm:items-stretch justify-center sm:justify-between gap-4 sm:gap-10">
                            {/* Dog Info Card (modern glassmorphism, left) */}
                            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-sky-100 p-8 flex flex-col w-full max-w-xs sm:w-auto items-center relative overflow-hidden mb-4 sm:mb-0 transition-transform duration-300 hover:scale-105 hover:shadow-3xl hover:border-sky-300">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-200 to-sky-400 flex items-center justify-center text-6xl shadow-lg mb-4 border-4 border-white group-hover:scale-110 group-hover:shadow-3xl transition-transform duration-300 overflow-hidden">
                                    {dogs[selectedDogIdx].photo ? (
                                        <Image
                                            src={dogs[selectedDogIdx].photo}
                                            alt="Dog photo"
                                            className="w-full h-full object-cover rounded-full"
                                            width={96}
                                            height={96}
                                            style={{ objectFit: 'cover', borderRadius: '9999px' }}
                                            priority
                                        />
                                    ) : (
                                        <span>🐶</span>
                                    )}
                                </div>
                                {/* Name */}
                                <div className="text-2xl font-extrabold text-sky-800 mb-2 text-center w-full truncate group-hover:text-sky-600 transition-colors duration-300">{dogs[selectedDogIdx].name}</div>
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 justify-center mb-3 w-full">
                                    {dogs[selectedDogIdx].breed && <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shadow">{dogs[selectedDogIdx].breed}</span>}
                                    {dogs[selectedDogIdx].furType && <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shadow">{dogs[selectedDogIdx].furType}</span>}
                                    {dogs[selectedDogIdx].country && (
                                        <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shadow">
                                            {dogs[selectedDogIdx].country}
                                        </span>
                                    )}
                                </div>
                                {/* Origin/City */}
                                <div className="text-sm text-gray-500 mb-1 w-full text-center">{dogs[selectedDogIdx].origin || <span className='italic text-gray-400'>No city/origin</span>}</div>
                                {/* Last updated */}
                                <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-mono">{lastUpdated && (<span title="Last updated">{lastUpdated}</span>)}</div>
                            </div>
                            {/* Weather Summary Card (modern glassmorphism, right, with micro-interactions) */}
                            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-sky-100 p-8 flex flex-col w-full max-w-xs sm:w-auto items-center justify-center relative overflow-hidden group transition-transform duration-300 hover:scale-105 hover:shadow-3xl">
                                {/* Weather Icon with micro-interaction */}
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 flex items-center justify-center text-6xl shadow-lg mb-4 border-4 border-white animate-pulse-slow group-hover:animate-bounce-slow transition-all duration-300">
                                    <span>{(() => {
                                        const code: number = Number(weather.current_weather.weathercode);
                                        const weatherCodeMap: Record<number, { icon: string }> = {
                                            0: { icon: '☀️' },
                                            1: { icon: '🌤️' },
                                            2: { icon: '⛅' },
                                            3: { icon: '☁️' },
                                            45: { icon: '🌫️' },
                                            48: { icon: '🌫️' },
                                            51: { icon: '🌦️' },
                                            53: { icon: '🌦️' },
                                            55: { icon: '🌦️' },
                                            56: { icon: '🌧️' },
                                            57: { icon: '🌧️' },
                                            61: { icon: '🌦️' },
                                            63: { icon: '🌧️' },
                                            65: { icon: '🌧️' },
                                            66: { icon: '🌧️' },
                                            67: { icon: '🌧️' },
                                            71: { icon: '❄️' },
                                            73: { icon: '❄️' },
                                            75: { icon: '❄️' },
                                            77: { icon: '❄️' },
                                            80: { icon: '🌦️' },
                                            81: { icon: '🌧️' },
                                            82: { icon: '🌧️' },
                                            85: { icon: '❄️' },
                                            86: { icon: '❄️' },
                                            95: { icon: '⛈️' },
                                            96: { icon: '⛈️' },
                                            99: { icon: '⛈️' },
                                        };
                                        return weatherCodeMap[code as keyof typeof weatherCodeMap]?.icon || '❓';
                                    })()}</span>
                                </div>
                                {/* Temperature */}
                                <div className="text-4xl font-extrabold text-sky-800 mb-1 text-center w-full drop-shadow group-hover:text-sky-600 transition-colors duration-300">{weather.current_weather.temperature}°C</div>
                                {/* Description */}
                                <div className="text-lg font-semibold text-gray-700 mb-3 text-center w-full group-hover:text-sky-700 transition-colors duration-300">{(() => {
                                    const code: number = Number(weather.current_weather.weathercode);
                                    const weatherCodeMap: Record<number, { desc: string }> = {
                                        0: { desc: 'Clear sky' },
                                        1: { desc: 'Mainly clear' },
                                        2: { desc: 'Partly cloudy' },
                                        3: { desc: 'Overcast' },
                                        45: { desc: 'Fog' },
                                        48: { desc: 'Depositing rime fog' },
                                        51: { desc: 'Drizzle: Light' },
                                        53: { desc: 'Drizzle: Moderate' },
                                        55: { desc: 'Drizzle: Dense' },
                                        56: { desc: 'Freezing Drizzle: Light' },
                                        57: { desc: 'Freezing Drizzle: Dense' },
                                        61: { desc: 'Rain: Slight' },
                                        63: { desc: 'Rain: Moderate' },
                                        65: { desc: 'Rain: Heavy' },
                                        66: { desc: 'Freezing Rain: Light' },
                                        67: { desc: 'Freezing Rain: Heavy' },
                                        71: { desc: 'Snow fall: Slight' },
                                        73: { desc: 'Snow fall: Moderate' },
                                        75: { desc: 'Snow fall: Heavy' },
                                        77: { desc: 'Snow grains' },
                                        80: { desc: 'Rain showers: Slight' },
                                        81: { desc: 'Rain showers: Moderate' },
                                        82: { desc: 'Rain showers: Violent' },
                                        85: { desc: 'Snow showers: Slight' },
                                        86: { desc: 'Snow showers: Heavy' },
                                        95: { desc: 'Thunderstorm' },
                                        96: { desc: 'Thunderstorm: Hail' },
                                        99: { desc: 'Thunderstorm: Heavy hail' },
                                    };
                                    return weatherCodeMap[code as keyof typeof weatherCodeMap]?.desc || 'Unknown';
                                })()}</div>
                                {/* Weather Stats Badges */}
                                <div className="flex flex-row gap-2 justify-center w-full mb-2">
                                    <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shadow flex flex-col items-center group-hover:bg-sky-200 transition-colors duration-300">
                                        <span className="font-bold">Max</span>
                                        {weather.daily.temperature_2m_max[0]}°C
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shadow flex flex-col items-center group-hover:bg-sky-200 transition-colors duration-300">
                                        <span className="font-bold">Min</span>
                                        {weather.daily.temperature_2m_min[0]}°C
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shadow flex flex-col items-center group-hover:bg-sky-200 transition-colors duration-300">
                                        <span className="font-bold">💧</span>
                                        {weather.daily.precipitation_sum[0]} mm
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Real schedule from API, now inside the main container and with time */}
                    {weather && weather.daily && weather.daily.time && weather.hourly && (
                        <div className="flex flex-wrap justify-between mb-4 gap-2">
                            {weather.daily.time.map((date: string, idx: number) => {
                                const day = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
                                // Get bath time preference for selected dog
                                const bathTimePref = dogs[selectedDogIdx]?.bathTimePref || "morning";
                                // Set hour range based on preference
                                let hourStart = 9, hourEnd = 17;
                                if (bathTimePref === "morning") { hourStart = 9; hourEnd = 12; }
                                else if (bathTimePref === "afternoon") { hourStart = 12; hourEnd = 17; }
                                // For custom, keep 9-17 for now (can be extended)
                                const hours = weather.hourly.time
                                    .map((t: string, i: number) => ({ t, i }))
                                    .filter((hour: { t: string, i: number }) => {
                                        if (!hour.t.startsWith(date + 'T')) return false;
                                        const hourNum = Number(hour.t.split('T')[1].split(':')[0]);
                                        return hourNum >= hourStart && hourNum <= hourEnd;
                                    });
                                // Check if any hour in this window is hot and dry
                                let found = null;
                                for (const hour of hours) {
                                    const temp = weather.hourly.temperature_2m[hour.i];
                                    const precip = weather.hourly.precipitation[hour.i];
                                    if (temp > 30 && precip < 0.1) {
                                        found = hour.t.split('T')[1].slice(0, 5); // e.g. '15:00'
                                        break;
                                    }
                                }
                                // Weathercode mapping for user-friendly description and icon
                                const weatherCodeMap: Record<number, { desc: string, icon: string }> = {
                                    0: { desc: 'Clear sky', icon: '☀️' },
                                    1: { desc: 'Mainly clear', icon: '🌤️' },
                                    2: { desc: 'Partly cloudy', icon: '⛅' },
                                    3: { desc: 'Overcast', icon: '☁️' },
                                    45: { desc: 'Fog', icon: '🌫️' },
                                    48: { desc: 'Depositing rime fog', icon: '🌫️' },
                                    51: { desc: 'Drizzle: Light', icon: '🌦️' },
                                    53: { desc: 'Drizzle: Moderate', icon: '🌦️' },
                                    55: { desc: 'Drizzle: Dense', icon: '🌦️' },
                                    56: { desc: 'Freezing Drizzle: Light', icon: '🌧️' },
                                    57: { desc: 'Freezing Drizzle: Dense', icon: '🌧️' },
                                    61: { desc: 'Rain: Slight', icon: '🌦️' },
                                    63: { desc: 'Rain: Moderate', icon: '🌧️' },
                                    65: { desc: 'Rain: Heavy', icon: '🌧️' },
                                    66: { desc: 'Freezing Rain: Light', icon: '🌧️' },
                                    67: { desc: 'Freezing Rain: Heavy', icon: '🌧️' },
                                    71: { desc: 'Snow fall: Slight', icon: '❄️' },
                                    73: { desc: 'Snow fall: Moderate', icon: '❄️' },
                                    75: { desc: 'Snow fall: Heavy', icon: '❄️' },
                                    77: { desc: 'Snow grains', icon: '❄️' },
                                    80: { desc: 'Rain showers: Slight', icon: '🌦️' },
                                    81: { desc: 'Rain showers: Moderate', icon: '🌧️' },
                                    82: { desc: 'Rain showers: Violent', icon: '🌧️' },
                                    85: { desc: 'Snow showers: Slight', icon: '❄️' },
                                    86: { desc: 'Snow showers: Heavy', icon: '❄️' },
                                    95: { desc: 'Thunderstorm: Slight/Moderate', icon: '⛈️' },
                                    96: { desc: 'Thunderstorm: Hail', icon: '⛈️' },
                                    99: { desc: 'Thunderstorm: Heavy hail', icon: '⛈️' },
                                };
                                let time = '--', reason = 'Wet', icon = '🌧️', weatherDesc = '';
                                const code = weather.daily.weathercode[idx];
                                if (found) {
                                    time = found;
                                    reason = 'Hot & Dry';
                                    icon = '☀️';
                                } else if (hours.some((hour: { t: string, i: number }) => weather.hourly.precipitation[hour.i] < 0.1)) {
                                    // If at least one hour is dry but not hot
                                    const dryHour = hours.find((hour: { t: string, i: number }) => weather.hourly.precipitation[hour.i] < 0.1);
                                    time = dryHour ? dryHour.t.split('T')[1].slice(0, 5) : '--';
                                    reason = 'Mild & Dry';
                                    icon = '⛅';
                                }
                                if (weatherCodeMap[code]) {
                                    weatherDesc = weatherCodeMap[code].desc;
                                    icon = weatherCodeMap[code].icon;
                                }
                                return (
                                    <div key={date} className="flex flex-col items-center flex-1 min-w-[45vw] max-w-[100vw] sm:min-w-[90px] sm:max-w-[120px] bg-white/60 backdrop-blur rounded-xl p-2 shadow border border-white/30">
                                        <div className="text-lg font-semibold text-sky-800 drop-shadow">{day}</div>
                                        <div className="text-base font-bold text-black">{time}</div>
                                        <div className="text-2xl">{icon}</div>
                                        <div className="text-xs text-sky-700">{reason}</div>
                                        <div className="text-xs text-gray-500 italic">{weatherDesc}</div>
                                        <div className="text-[10px] text-gray-400">Why? {reason === 'Hot & Dry' ? t.whyBest : reason === 'Mild & Dry' ? t.whyOk : t.whyNo}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mb-2">
                        <div className="text-xs text-gray-500 font-mono">{t.debug}</div>
                        <ul className="text-xs text-gray-700 bg-sky-50/80 rounded p-2 max-h-24 overflow-y-auto border border-sky-100/60">
                            {logs.map((log, i) => <li key={i}>{log}</li>)}
                        </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 mt-6">
                        {/* Notification button removed as requested */}
                        <button
                            type="button"
                            onClick={handleRefreshWeather}
                            className="px-4 py-1 flex items-center justify-center rounded text-xs font-semibold border bg-white/80 text-sky-700 border-sky-400 hover:bg-sky-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            title="Refresh weather data"
                        >
                            {t.refreshWeather}
                        </button>
                        <Link
                            href={`/onboarding/edit/${selectedDogIdx}`}
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    localStorage.setItem("selectedDogIdx", String(selectedDogIdx));
                                }
                            }}
                            className="flex-1 py-2 bg-sky-200 text-sky-900 rounded text-center hover:bg-sky-300"
                        >
                            {t.editDog}
                        </Link>
                        <Link href="/" className="flex-1 py-2 bg-sky-600 text-white rounded text-center hover:bg-sky-700">{t.home}</Link>
                    </div>
                    {/* Weather Source Info Icon - bottom right of schedule card */}
                    <div className="absolute bottom-3 right-4 z-10">
                        <div className="group relative flex items-center">
                            <button
                                type="button"
                                aria-label="Weather data source info"
                                tabIndex={0}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/70 border border-sky-200 text-sky-700 shadow hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                            >
                                <span className="font-bold text-base">i</span>
                            </button>
                            <div className="absolute bottom-8 right-0 hidden group-hover:block group-focus-within:block bg-white/90 border border-sky-200 rounded-lg shadow-lg px-4 py-2 text-xs text-sky-800 whitespace-nowrap z-20 min-w-[180px]">
                                <a
                                    href="https://open-meteo.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 hover:underline"
                                >
                                    <span role="img" aria-label="globe" className="text-base">🌐</span>
                                    Weather data by Open-Meteo
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                {/* If no dogs, show a friendly message and onboarding button */}
                {dogs.length === 0 && (
                    <div className="w-full max-w-2xl min-h-[40vh] bg-white/60 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/30 flex flex-col items-center justify-center text-center mt-16">
                        <span className="text-5xl mb-4">🐶</span>
                        <h2 className="text-2xl font-bold text-sky-900 mb-2">{t.noDogs}</h2>
                        <p className="mb-6 text-sky-800">{t.addDogInfo}</p>
                        <Link href="/onboarding" className="px-6 py-3 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition font-semibold">{t.addDog}</Link>
                    </div>
                )}
            </div>
        </main>
    );
}

// Add custom keyframes for background animation
// Add these to your global CSS (e.g., globals.css or tailwind.config.js):
//
// @layer utilities {
//   @keyframes bg-morning { 0%{background-position:0 0;} 100%{background-position:100% 100%;} }
//   .animate-bg-morning { animation: bg-morning 20s linear infinite alternate; }
//   @keyframes bg-afternoon { 0%{background-position:0 0;} 100%{background-position:100% 0;} }
//   .animate-bg-afternoon { animation: bg-afternoon 30s linear infinite alternate; }
//   @keyframes bg-evening { 0%{background-position:0 0;} 100%{background-position:0 100%;} }
//   .animate-bg-evening { animation: bg-evening 25s linear infinite alternate; }
//   @keyframes bg-night { 0%{background-position:0 0;} 100%{background-position:100% 100%;} }
//   .animate-bg-night { animation: bg-night 40s linear infinite alternate; }
//   @keyframes cloud-move { 0%{transform:translateX(0);} 100%{transform:translateX(80px);} }
//   .animate-cloud-move { animation: cloud-move 30s linear infinite alternate; }
//   @keyframes sunset-move { 0%{transform:translateY(0);} 100%{transform:translateY(40px);} }
//   .animate-sunset-move { animation: sunset-move 20s linear infinite alternate; }
//   @keyframes star-twinkle { 0%,100%{opacity:0.7;} 50%{opacity:1;} }
//   .animate-star-twinkle { animation: star-twinkle 2.5s ease-in-out infinite; }
//   @keyframes star-twinkle2 { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
//   .animate-star-twinkle2 { animation: star-twinkle2 3.5s ease-in-out infinite; }
// }
