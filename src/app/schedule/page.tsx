"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { registerServiceWorker, requestNotificationPermission } from "@/utils/notifications";

const countryList = [
    { code: "PH", name: "Philippines" },
    { code: "US", name: "United States" },
    { code: "JP", name: "Japan" },
    // Add more as needed
];

function getCountryName(code: string) {
    const found = countryList.find(c => c.code === code);
    return found ? found.name : code;
}

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
    } catch (err) {
        throw new Error("Could not fetch weather for " + city);
    }
}

const mockSchedule = [
    { day: "Sun", time: "3–5 PM", icon: "☀️", reason: "Hot" },
    { day: "Mon", time: "2–4 PM", icon: "☁️", reason: "Wet" },
    { day: "Tue", time: "--", icon: "🌧️", reason: "Wet" },
    { day: "Wed", time: "4–6 PM", icon: "☀️", reason: "Hot" },
    { day: "Thu", time: "--", icon: "🌧️", reason: "Wet" },
    { day: "Fri", time: "1–3 PM", icon: "☀️", reason: "Hot" },
    { day: "Sat", time: "3–5 PM", icon: "☀️", reason: "Hot" },
];

export default function Schedule() {
    const [dogs, setDogs] = useState<{ name: string, origin?: string, country?: string }[]>([]);
    const [selectedDogIdx, setSelectedDogIdx] = useState<number>(0);
    const [weather, setWeather] = useState<any>(null);
    const [city, setCity] = useState<string>("");
    const [country, setCountry] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    const [showWeatherJson, setShowWeatherJson] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(false);

    // Helper to get city/country for selected dog
    const getDogLocation = (dog: any) => {
        let city = dog.origin ? dog.origin.split(",")[0].trim() : "";
        let country = dog.country || localStorage.getItem("country") || "";
        return { city, country };
    };

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
            // Remove selectedDogIdx after use
            localStorage.removeItem("selectedDogIdx");
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

    const handleDogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDogIdx(Number(e.target.value));
    };

    const handleNotify = async () => {
        const granted = await requestNotificationPermission();
        setNotifEnabled(granted);
        if (granted) {
            alert("Notifications enabled! You'll get reminders for your dog's bath schedule (if supported by your browser).");
        } else {
            alert("Notifications are blocked or not supported.");
        }
    };

    // Remove selected dog
    const handleRemoveDog = () => {
        if (dogs.length <= 1) return;
        if (confirm(`Remove ${dogs[selectedDogIdx].name}?`)) {
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
            } catch (e: any) {
                setError(e.message);
                setLogs(l => [...l, `Weather refresh error: ${e.message}`]);
            }
        }
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-sky-200/60 via-white/80 to-sky-400/60 flex flex-col items-center justify-center p-0">
            <div className="w-full min-h-screen flex flex-col items-center justify-center">
                {/* Dog picker card */}
                {dogs.length > 0 && (
                    <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between bg-white/60 backdrop-blur rounded-xl shadow border border-white/30 p-2 sm:p-4 mb-6 mt-8 gap-2">
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <span className="text-2xl">🐶</span>
                            <label htmlFor="dog-picker" className="text-black font-bold text-lg">Select Dog:</label>
                            <select
                                id="dog-picker"
                                value={selectedDogIdx}
                                onChange={handleDogChange}
                                className="rounded px-2 py-1 border border-sky-300 bg-white/80 text-sky-900 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm sm:text-base"
                            >
                                {dogs.map((d, i) => (
                                    <option key={i} value={i}>{d.name}</option>
                                ))}
                            </select>
                            {dogs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleRemoveDog}
                                    className="ml-0 sm:ml-2 mt-2 sm:mt-0 px-3 py-1 rounded bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 font-semibold text-xs shadow"
                                    title="Remove selected dog"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <Link href="/onboarding" className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-1 bg-sky-200 text-sky-900 rounded hover:bg-sky-300 font-semibold shadow border border-sky-300 text-center">+ Add Dog</Link>
                    </div>
                )}
                <div className="w-full max-w-4xl min-h-[80vh] bg-white/40 backdrop-blur-md rounded-none sm:rounded-2xl shadow-2xl p-2 sm:p-12 border border-white/30 flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-sky-900 drop-shadow text-center">Weekly Bath Schedule</h2>
                    {dogs.length === 1 && (
                        <div className="mb-2 text-sky-800 font-semibold text-lg text-center sm:text-left">For: {dogs[0].name}</div>
                    )}
                    <div className="mb-2 text-sky-700 text-base text-center sm:text-left">City: <span className="font-semibold">{city || <span className='italic text-gray-400'>Not set</span>}</span></div>
                    <div className="mb-2 text-sky-700 text-base text-center sm:text-left">Country: <span className="font-semibold">{country}</span> <span className="text-xs text-gray-500">({getCountryName(country)})</span></div>
                    {lastUpdated && <div className="mb-2 text-xs text-gray-500 text-center sm:text-left">Last updated: {lastUpdated}</div>}
                    {error && <div className="text-red-500 mb-2 text-center sm:text-left">{error}</div>}
                    {weather ? (
                        <div className="mb-4">
                            <div className="text-sky-900 font-bold mb-1 text-lg text-center sm:text-left">
                                Today: {weather.current_weather.temperature}°C, Code: {weather.current_weather.weathercode}
                            </div>
                            <div className="text-sky-700 text-sm text-center sm:text-left">
                                Max: {weather.daily.temperature_2m_max[0]}°C, Min: {weather.daily.temperature_2m_min[0]}°C | Precip: {weather.daily.precipitation_sum[0]}mm
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 flex items-center gap-2 text-sky-700 justify-center">
                            <svg className="animate-spin h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                            Loading weather...
                        </div>
                    )}
                    {/* Real schedule from API, now inside the main container and with time */}
                    {weather && weather.daily && weather.daily.time && weather.hourly && (
                        <div className="flex flex-wrap justify-between mb-4 gap-2">
                            {weather.daily.time.map((date: string, idx: number) => {
                                const day = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
                                // Find all hourly indices for this day between 13:00 and 17:00
                                const hours = weather.hourly.time
                                    .map((t: string, i: number) => ({ t, i }))
                                    .filter((hour: { t: string, i: number }) => hour.t.startsWith(date + 'T') && [13, 14, 15, 16, 17].includes(Number(hour.t.split('T')[1].split(':')[0])));
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
                                        <div className="text-[10px] text-gray-400">Why? {reason === 'Hot & Dry' ? 'Best for dog baths: warm and dry.' : reason === 'Mild & Dry' ? 'Okay for baths: not rainy.' : 'Not recommended: wet or rainy.'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mb-2">
                        <div className="text-xs text-gray-500 font-mono">Debug/Logs:</div>
                        <ul className="text-xs text-gray-700 bg-sky-50/80 rounded p-2 max-h-24 overflow-y-auto border border-sky-100/60">
                            {logs.map((log, i) => <li key={i}>{log}</li>)}
                        </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 mt-6">
                        <button
                            type="button"
                            onClick={handleNotify}
                            className={`px-4 py-1 rounded text-xs font-semibold transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-2 ${notifEnabled ? 'bg-green-100 text-green-700 border-green-400 hover:bg-green-200' : 'bg-sky-100 text-sky-700 border-sky-400 hover:bg-sky-200'}`}
                            disabled={notifEnabled}
                            title={notifEnabled ? 'Notifications enabled' : 'Enable browser notifications'}
                        >
                            {notifEnabled ? '🔔 Enabled' : '🔕 Enable Notifications'}
                        </button>
                        <button
                            type="button"
                            onClick={handleRefreshWeather}
                            className="px-4 py-1 rounded text-xs font-semibold border bg-white/80 text-sky-700 border-sky-400 hover:bg-sky-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            title="Refresh weather data"
                        >
                            ⟳ Refresh Weather
                        </button>
                        <Link
                            href={`/onboarding/edit/${selectedDogIdx}`}
                            className="flex-1 py-2 bg-sky-200 text-sky-900 rounded text-center hover:bg-sky-300"
                        >
                            Edit Dog Info
                        </Link>
                        <Link href="/" className="flex-1 py-2 bg-sky-600 text-white rounded text-center hover:bg-sky-700">Home</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
