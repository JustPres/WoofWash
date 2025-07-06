"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/solid";
import { getTimeOfDay, getTitleTextColorClass, type TimeOfDay } from "@/utils/timeOfDay";

const furTypes = [
    "Short Single Coat",
    "Long Single Coat",
    "Short Double Coat",
    "Curly/Wavy",
    "Hairless"
];

const countryList = [
    { code: "PH", name: "Philippines" },
    { code: "US", name: "United States" },
    { code: "JP", name: "Japan" },
    // Add more as needed
];

const translations: Record<string, Record<string, string>> = {
    en: {
        addDog: "Add Dog",
        name: "Name",
        breed: "Breed",
        origin: "Place of Birth/Origin",
        furType: "Fur Type",
        country: "Country",
        save: "Save & Continue",
        required: "Please fill in all fields.",
        onboardingTitle: "Add Your Dog",
        toast: "Dog(s) saved!",
        language: "Language:"
    },
    fil: {
        addDog: "Magdagdag ng Aso",
        name: "Pangalan",
        breed: "Lahi",
        origin: "Lugar ng Kapanganakan/Pinagmulan",
        furType: "Uri ng Balahibo",
        country: "Bansa",
        save: "I-save at Magpatuloy",
        required: "Pakiusap punan lahat ng patlang.",
        onboardingTitle: "Idagdag ang Iyong Aso",
        toast: "Nai-save ang mga aso!",
        language: "Wika:"
    },
    ja: {
        addDog: "犬を追加",
        name: "名前",
        breed: "犬種",
        origin: "出生地/原産地",
        furType: "毛のタイプ",
        country: "国",
        save: "保存して続行",
        required: "すべての項目を入力してください。",
        onboardingTitle: "あなたの犬を追加",
        toast: "犬が保存されました！",
        language: "言語:"
    }
};

function convertTo24Hour(time12h: string) {
    // Accepts e.g. '2:30 PM' or '2 PM' or '14:00'
    const match = time12h.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return time12h;
    let hour = parseInt(match[1], 10);
    let min = match[2] ? parseInt(match[2], 10) : 0; // eslint-disable-line prefer-const
    const ampm = match[3]?.toUpperCase();
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

export default function Onboarding() {
    const [dogs, setDogs] = useState([
        { name: "", breed: "", origin: "", furType: "", country: "PH", photo: "" }
    ]);
    // Removed unused country state to fix ESLint error
    const [timeInput, setTimeInput] = useState("");
    const [convertedTime, setConvertedTime] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [lang, setLang] = useState("en");
    const t = translations[lang] || translations.en;
    const [fabRotating, setFabRotating] = useState(false);
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

    useEffect(() => {
        const stored = localStorage.getItem("lang");
        if (stored) setLang(stored);
    }, []);

    // Time of day effect
    useEffect(() => {
        setTimeOfDay(getTimeOfDay());
        const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // ...existing code...

    const handleChange = (idx: number, field: string, value: string) => {
        setDogs((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            return updated;
        });
    };

    const handleCountryChange = (idx: number, value: string) => {
        setDogs((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], country: value };
            return updated;
        });
    };

    // Update addDog to include photo
    const addDog = () => {
        setFabRotating(true);
        setDogs((prev) => [...prev, { name: "", breed: "", origin: "", furType: "", country: "PH", photo: "" }]);
    };

    const removeDog = (idx: number) => {
        if (window.confirm(`Are you sure you want to remove ${dogs[idx].name || "this dog"}?`)) {
            setDogs((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
        }
    };

    // Validate city-country using Open-Meteo geocoding
    async function validateCityCountry(city: string, country: string) {
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json&country=${country}`);
            if (!res.ok) return false;
            const data = await res.json();
            return data.results && data.results.length > 0;
        } catch {
            return false;
        }
    }

    const [formError, setFormError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        // Validate all dog origins
        for (const dog of dogs) {
            const city = dog.origin.split(",")[0].trim();
            const valid = await validateCityCountry(city, dog.country || "PH");
            if (!valid) {
                setFormError("City &quot;" + city + "&quot; not found in selected country.");
                return;
            }
        }
        // Merge new dogs with existing dogs in localStorage
        let existingDogs: unknown[] = [];
        try {
            const stored = localStorage.getItem("dogs");
            if (stored) {
                existingDogs = JSON.parse(stored);
            }
        } catch { }
        // Avoid duplicates by name+origin (simple check)
        const mergedDogs = [...existingDogs];
        dogs.forEach(newDog => {
            if (!mergedDogs.some((d: unknown) => {
                if (typeof d === "object" && d !== null && "name" in d && "origin" in d) {
                    return (d as { name: string; origin: string }).name === newDog.name && (d as { name: string; origin: string }).origin === newDog.origin;
                }
                return false;
            })) {
                mergedDogs.push({ ...newDog, country: newDog.country || "PH" });
            }
        });
        try {
            localStorage.setItem("dogs", JSON.stringify(mergedDogs));
            // Set selectedDogIdx to the last added dog
            localStorage.setItem("selectedDogIdx", String(mergedDogs.length - 1));
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                window.location.assign("/schedule");
            }, 1200);
        } catch (err) {
            if (err instanceof DOMException && err.name === "QuotaExceededError") {
                setFormError("Image or data is too large to save. Please use a smaller image or remove some dogs.");
            } else {
                setFormError("Failed to save info. Please check your browser settings or use a smaller image.");
            }
            console.error("[DEBUG] localStorage error:", err);
        }
    };

    useEffect(() => {
        if (fabRotating) {
            const timeout = setTimeout(() => setFabRotating(false), 400);
            return () => clearTimeout(timeout);
        }
    }, [fabRotating]);

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-0">
            {showToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg text-base animate-fade-in">
                    {t.toast}
                </div>
            )}
            <div className="w-full max-w-2xl min-h-[70vh] bg-white/40 backdrop-blur-md rounded-none sm:rounded-2xl shadow-2xl p-2 sm:p-12 border border-white/30 flex flex-col">
                {/* Back Button */}
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="mb-4 w-fit px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
                    aria-label="Back"
                >
                    ← Back
                </button>
                <h2 className={`text-2xl sm:text-3xl font-extrabold mb-4 ${getTitleTextColorClass(timeOfDay)} drop-shadow text-center`}>{t.onboardingTitle}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {dogs.map((dog, idx) => (
                        <div key={idx} className="bg-white/60 backdrop-blur rounded-xl p-2 sm:p-4 mb-2 border border-white/30 shadow flex flex-col gap-2 relative">
                            {/* Dog Photo Upload */}
                            <label className="block mb-1 font-semibold flex items-center gap-1 text-black text-sm sm:text-base">
                                Photo (optional)
                                <span className="relative group cursor-pointer">
                                    <span className="text-sky-500 text-base">&#9432;</span>
                                    <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white/90 text-sky-900 text-xs rounded shadow p-2 w-56 border border-sky-200">Upload a small photo of your dog. Images are stored in your browser (max 5MB total for all dogs).</span>
                                </span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-full border p-2 rounded text-black bg-white/80 text-sm sm:text-base"
                                onChange={async e => {
                                    const file = e.target.files?.[0];
                                    console.log('[DEBUG] Selected file:', file);
                                    if (!file) return;
                                    console.log('[DEBUG] File size (bytes):', file.size);
                                    if (file.size > 10 * 1024 * 1024) {
                                        alert("Please select an image smaller than 10MB.");
                                        return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = ev => {
                                        console.log('[DEBUG] File loaded, setting photo.');
                                        handleChange(idx, "photo", ev.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                }}
                            />
                            {(() => {
                                console.log('[DEBUG] Rendering dog.photo:', dog.photo);
                                return dog.photo ? (
                                    <Image src={dog.photo} alt="Dog photo preview" className="w-20 h-20 object-cover rounded-full border-2 border-sky-200 mt-2" width={80} height={80} />
                                ) : null;
                            })()}
                            <div className="text-xs text-gray-500 mt-1">Images are stored in your browser (max 5MB total for all dogs).</div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 min-w-0">
                                    <label className="block mb-1 font-semibold flex items-center gap-1 text-black text-sm sm:text-base">
                                        {t.name}
                                        <span className="relative group cursor-pointer">
                                            <span className="text-sky-500 text-base">&#9432;</span>
                                            <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white/90 text-sky-900 text-xs rounded shadow p-2 w-48 border border-sky-200">Your dog&apos;s name for easy identification.</span>
                                        </span>
                                    </label>
                                    <input
                                        className="border p-2 rounded text-black w-full bg-white/80 text-sm sm:text-base"
                                        placeholder="Name"
                                        value={dog.name}
                                        onChange={e => handleChange(idx, "name", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label className="block mb-1 font-semibold flex items-center gap-1 text-black text-sm sm:text-base">
                                        {t.breed}
                                        <span className="relative group cursor-pointer">
                                            <span className="text-sky-500 text-base">&#9432;</span>
                                            <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white/90 text-sky-900 text-xs rounded shadow p-2 w-48 border border-sky-200">Breed helps us tailor bath advice for your dog&apos;s fur type.</span>
                                        </span>
                                    </label>
                                    <input
                                        className="border p-2 rounded text-black w-full bg-white/80 text-sm sm:text-base"
                                        placeholder="Breed"
                                        value={dog.breed}
                                        onChange={e => handleChange(idx, "breed", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <label className="block mb-1 font-semibold flex items-center gap-1 text-black text-sm sm:text-base">
                                {t.origin}
                                <span className="relative group cursor-pointer">
                                    <span className="text-sky-500 text-base">&#9432;</span>
                                    <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white/90 text-sky-900 text-xs rounded shadow p-2 w-56 border border-sky-200">Enter the city or town where your dog is from. This is used to fetch local weather for the bath schedule.</span>
                                </span>
                            </label>
                            <input
                                className="w-full border p-2 rounded text-black bg-white/80 text-sm sm:text-base"
                                placeholder="e.g. Manila, Cebu, Tokyo"
                                value={dog.origin}
                                onChange={e => handleChange(idx, "origin", e.target.value)}
                                required
                            />
                            <label className="block mb-1 font-semibold flex items-center gap-1 text-black text-sm sm:text-base">
                                {t.furType}
                                <span className="relative group cursor-pointer">
                                    <span className="text-sky-500 text-base">&#9432;</span>
                                    <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white/90 text-sky-900 text-xs rounded shadow p-2 w-56 border border-sky-200">Fur type affects how often your dog should be bathed. Choose the closest match.</span>
                                </span>
                            </label>
                            <select
                                className="w-full border p-2 rounded text-black bg-white/80 text-sm sm:text-base"
                                value={dog.furType}
                                onChange={e => handleChange(idx, "furType", e.target.value)}
                                required
                            >
                                <option value="" className="text-black">Select Fur Type</option>
                                {furTypes.map((type) => (
                                    <option key={type} value={type} className="text-black">{type}</option>
                                ))}
                            </select>
                            <label className="block mb-1 font-semibold flex items-center gap-1 text-black text-sm sm:text-base">
                                {t.country}
                                <span className="relative group cursor-pointer">
                                    <span className="text-sky-500 text-base">&#9432;</span>
                                    <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white/90 text-sky-900 text-xs rounded shadow p-2 w-48 border border-sky-200">Select your dog&apos;s country. This helps us fetch accurate weather data for your dog&apos;s location.</span>
                                </span>
                            </label>
                            <select className="w-full border p-2 rounded text-black bg-white/80 text-sm sm:text-base" value={dog.country} onChange={e => handleCountryChange(idx, e.target.value)}>
                                {countryList.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>

                            {dogs.length > 1 && (
                                <button type="button" onClick={() => removeDog(idx)} className="absolute top-2 right-2 text-red-500 text-xl bg-white/70 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-100 transition">&times;</button>
                            )}
                        </div>
                    ))}
                    <label className="block mb-1 font-semibold flex items-center gap-1 text-black mt-2 text-sm sm:text-base">
                        Bath Time (optional)
                        <span className="relative group cursor-pointer">
                            <span className="text-sky-500 text-base">&#9432;</span>
                            <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white/90 text-sky-900 text-xs rounded shadow p-2 w-56 border border-sky-200">Enter a time in 12-hour (e.g. 2:30 PM) or 24-hour (14:30) format. We&apos;ll show the 24-hour version for you.</span>
                        </span>
                    </label>
                    <input
                        className="w-full border p-2 rounded text-black bg-white/80 text-sm sm:text-base"
                        placeholder="e.g. 2:30 PM or 14:30"
                        value={timeInput}
                        onChange={e => {
                            setTimeInput(e.target.value);
                            setConvertedTime(convertTo24Hour(e.target.value));
                        }}
                    />
                    {timeInput && convertedTime !== timeInput && (
                        <div className="text-xs text-sky-700 mt-1">24-hour format: <span className="font-mono">{convertedTime}</span></div>
                    )}
                    {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
                    <button type="submit" className="w-full py-2 bg-sky-600 text-white rounded hover:bg-sky-700 font-bold shadow text-base sm:text-lg">{t.save}</button>
                </form>
            </div>
            {/* Floating Action Button for Add Dog */}
            <button
                type="button"
                onClick={addDog}
                className={`fixed bottom-6 right-6 z-50 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 ${fabRotating ? 'animate-fab-rotate' : ''}`}
                aria-label={t.addDog}
            >
                <PlusIcon className="h-8 w-8" />
            </button>
        </main>
    );
}
