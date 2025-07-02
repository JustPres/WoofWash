"use client";
import React, { useContext } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageContext } from "@/app/layout";
import Image from "next/image";

const furTypes = [
    "Short Single Coat",
    "Long Single Coat",
    "Short Double Coat",
    "Long Double Coat",
    "Curly/Wavy",
    "Hairless"
];

const countryList = [
    { code: "PH", name: "Philippines" },
    { code: "US", name: "United States" },
    { code: "JP", name: "Japan" },
    // Add more as needed
];

const translations: Record<string, {
    editDog: string;
    name: string;
    breed: string;
    origin: string;
    furType: string;
    country: string;
    selectFurType: string;
    validating: string;
    back: string;
    save: string;
    cityNotFound: (city: string) => string;
    saveError: string;
}> = {
    en: {
        editDog: "Edit Dog Info",
        name: "Name",
        breed: "Breed",
        origin: "Place of Birth/Origin",
        furType: "Fur Type",
        country: "Country",
        selectFurType: "Select Fur Type",
        validating: "Validating city and country...",
        back: "← Back",
        save: "Save Changes",
        cityNotFound: (city: string) => `City \"${city}\" not found in selected country.`,
        saveError: "Failed to save info. Please check your browser settings.",
    },
    fil: {
        editDog: "I-edit ang Impormasyon ng Aso",
        name: "Pangalan",
        breed: "Lahi",
        origin: "Lugar ng Kapanganakan/Pinagmulan",
        furType: "Uri ng Balahibo",
        country: "Bansa",
        selectFurType: "Pumili ng Uri ng Balahibo",
        validating: "Sini-siyasat ang lungsod at bansa...",
        back: "← Bumalik",
        save: "I-save ang mga Pagbabago",
        cityNotFound: (city: string) => `Hindi natagpuan ang lungsod \"${city}\" sa napiling bansa.`,
        saveError: "Hindi na-save ang impormasyon. Pakisuri ang iyong browser settings.",
    },
    ja: {
        editDog: "犬の情報を編集",
        name: "名前",
        breed: "犬種",
        origin: "出生地/原産地",
        furType: "毛のタイプ",
        country: "国",
        selectFurType: "毛のタイプを選択",
        validating: "都市と国を検証中...",
        back: "← 戻る",
        save: "変更を保存",
        cityNotFound: (city: string) => `選択した国に都市\"${city}\"が見つかりません。`,
        saveError: "情報の保存に失敗しました。ブラウザの設定を確認してください。",
    },
};

export default function EditDog({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: dogId } = React.use(params);
    const [dog, setDog] = useState({ name: "", breed: "", origin: "", furType: "", country: "PH", photo: "", bathTimePref: "morning" });
    const [country, setCountry] = useState("PH");
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    const { lang } = useContext(LanguageContext);
    const t = translations[lang] || translations.en;

    useEffect(() => {
        if (typeof window !== "undefined" && dogId !== undefined) {
            const stored = localStorage.getItem("dogs");
            if (stored) {
                const dogs = JSON.parse(stored);
                const idx = parseInt(dogId, 10);
                if (dogs[idx]) {
                    setDog(dogs[idx]);
                    setCountry(dogs[idx].country || "PH");
                }
            }
        }
    }, [dogId]);

    const handleChange = (field: string, value: string) => {
        setDog(prev => ({ ...prev, [field]: value }));
    };

    // Bath time preference options
    const bathTimeOptions = [
        { value: "morning", label: "Morning (9am–12pm)" },
        { value: "afternoon", label: "Afternoon (12pm–5pm)" },
        { value: "custom", label: "Custom (set below)" },
    ];

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setLoading(true);
        // Validate city-country
        const city = dog.origin.split(",")[0].trim();
        const valid = await validateCityCountry(city, country);
        setLoading(false);
        if (!valid) {
            setFormError(t.cityNotFound(city));
            return;
        }
        try {
            const stored = localStorage.getItem("dogs");
            if (stored && dogId !== undefined) {
                const dogs = JSON.parse(stored);
                const idx = parseInt(dogId, 10);
                dogs[idx] = dog;
                localStorage.setItem("dogs", JSON.stringify(dogs));
                router.push("/schedule");
            }
        } catch {
            setFormError(t.saveError);
        }
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-sky-200/60 via-white/80 to-sky-400/60 flex flex-col items-center justify-center p-0">
            <div className="w-full max-w-xl min-h-[50vh] bg-white/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/30 flex flex-col">
                <h2 className="text-2xl font-extrabold mb-4 text-sky-900 drop-shadow">{t.editDog}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label htmlFor="dog-name" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        {t.name}
                    </label>
                    <input
                        id="dog-name"
                        aria-label={t.name}
                        className="border p-2 rounded text-black w-full bg-white/80 focus:ring-2 focus:ring-sky-400"
                        placeholder={t.name}
                        value={dog.name}
                        onChange={e => handleChange("name", e.target.value)}
                        required
                    />
                    <label htmlFor="dog-breed" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        {t.breed}
                    </label>
                    <input
                        id="dog-breed"
                        aria-label={t.breed}
                        className="border p-2 rounded text-black w-full bg-white/80 focus:ring-2 focus:ring-sky-400"
                        placeholder={t.breed}
                        value={dog.breed}
                        onChange={e => handleChange("breed", e.target.value)}
                        required
                    />
                    <label htmlFor="dog-origin" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        {t.origin}
                    </label>
                    <input
                        id="dog-origin"
                        aria-label={t.origin}
                        className="w-full border p-2 rounded text-black bg-white/80 focus:ring-2 focus:ring-sky-400"
                        placeholder="e.g. Manila, Cebu, Tokyo"
                        value={dog.origin}
                        onChange={e => handleChange("origin", e.target.value)}
                        required
                    />
                    <label htmlFor="dog-furType" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        {t.furType}
                    </label>
                    <select
                        id="dog-furType"
                        aria-label={t.furType}
                        className="w-full border p-2 rounded text-black bg-white/80 focus:ring-2 focus:ring-sky-400"
                        value={dog.furType}
                        onChange={e => handleChange("furType", e.target.value)}
                        required
                    >
                        <option value="" className="text-black">{t.selectFurType}</option>
                        {furTypes.map((type) => (
                            <option key={type} value={type} className="text-black">{type}</option>
                        ))}
                    </select>
                    <label htmlFor="dog-bathTimePref" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        Preferred Bath Time
                    </label>
                    <select
                        id="dog-bathTimePref"
                        aria-label="Preferred Bath Time"
                        className="w-full border p-2 rounded text-black bg-white/80 focus:ring-2 focus:ring-sky-400"
                        value={dog.bathTimePref}
                        onChange={e => handleChange("bathTimePref", e.target.value)}
                        required
                    >
                        {bathTimeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <label htmlFor="dog-country" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        {t.country}
                    </label>
                    <select
                        id="dog-country"
                        aria-label={t.country}
                        className="w-full border p-2 rounded text-black bg-white/80 focus:ring-2 focus:ring-sky-400"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                    >
                        {countryList.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                    <label className="block mb-1 font-semibold flex items-center gap-1 text-black">
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
                            if (!file) return;
                            console.debug('Selected file:', file.name, 'size:', file.size);
                            if (file.size > 10 * 1024 * 1024) {
                                alert('Please select an image smaller than 10MB.');
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = ev => {
                                setDog(prev => ({ ...prev, photo: ev.target?.result as string }));
                            };
                            reader.readAsDataURL(file);
                        }}
                    />
                    {dog.photo && (
                        <Image src={dog.photo} alt="Dog photo preview" className="w-20 h-20 object-cover rounded-full border-2 border-sky-200 mt-2" width={80} height={80} />
                    )}
                    <div className="text-xs text-gray-500 mt-1">Images are stored in your browser (max 5MB total for all dogs).</div>
                    {formError && <div className="text-red-500 text-sm mb-2" aria-live="polite">{formError}</div>}
                    {loading && (
                        <div className="flex items-center gap-2 text-sky-700 text-sm mb-2" aria-live="polite">
                            <svg className="animate-spin h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                            {t.validating}
                        </div>
                    )}
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
                            aria-label={t.back}
                        >
                            {t.back}
                        </button>
                        <button type="submit" className="flex-1 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 font-bold shadow focus:outline-none focus:ring-2 focus:ring-sky-400">{t.save}</button>
                    </div>
                </form>
            </div>
        </main>
    );
}
