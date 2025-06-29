"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function EditDog({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: dogId } = React.use(params);
    const [dog, setDog] = useState({ name: "", breed: "", origin: "", furType: "" });
    const [country, setCountry] = useState("PH");
    const [error, setError] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined" && dogId !== undefined) {
            const stored = localStorage.getItem("dogs");
            const countryStored = localStorage.getItem("country");
            if (stored) {
                const dogs = JSON.parse(stored);
                const idx = parseInt(dogId, 10);
                if (dogs[idx]) setDog(dogs[idx]);
            }
            if (countryStored) setCountry(countryStored);
        }
    }, [dogId]);

    const handleChange = (field: string, value: string) => {
        setDog(prev => ({ ...prev, [field]: value }));
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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setLoading(true);
        // Validate city-country
        const city = dog.origin.split(",")[0].trim();
        const valid = await validateCityCountry(city, country);
        setLoading(false);
        if (!valid) {
            setFormError(`City "${city}" not found in selected country.`);
            return;
        }
        try {
            const stored = localStorage.getItem("dogs");
            if (stored && dogId !== undefined) {
                const dogs = JSON.parse(stored);
                const idx = parseInt(dogId, 10);
                dogs[idx] = dog;
                localStorage.setItem("dogs", JSON.stringify(dogs));
                localStorage.setItem("country", country);
                router.push("/schedule");
            }
        } catch (err) {
            setFormError("Failed to save info. Please check your browser settings.");
        }
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-sky-200/60 via-white/80 to-sky-400/60 flex flex-col items-center justify-center p-0">
            <div className="w-full max-w-xl min-h-[50vh] bg-white/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/30 flex flex-col">
                <h2 className="text-2xl font-extrabold mb-4 text-sky-900 drop-shadow">Edit Dog Info</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label htmlFor="dog-name" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        Name
                    </label>
                    <input
                        id="dog-name"
                        aria-label="Dog Name"
                        className="border p-2 rounded text-black w-full bg-white/80 focus:ring-2 focus:ring-sky-400"
                        placeholder="Name"
                        value={dog.name}
                        onChange={e => handleChange("name", e.target.value)}
                        required
                    />
                    <label htmlFor="dog-breed" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        Breed
                    </label>
                    <input
                        id="dog-breed"
                        aria-label="Dog Breed"
                        className="border p-2 rounded text-black w-full bg-white/80 focus:ring-2 focus:ring-sky-400"
                        placeholder="Breed"
                        value={dog.breed}
                        onChange={e => handleChange("breed", e.target.value)}
                        required
                    />
                    <label htmlFor="dog-origin" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        Place of Birth/Origin
                    </label>
                    <input
                        id="dog-origin"
                        aria-label="Dog Place of Birth or Origin"
                        className="w-full border p-2 rounded text-black bg-white/80 focus:ring-2 focus:ring-sky-400"
                        placeholder="e.g. Manila, Cebu, Tokyo"
                        value={dog.origin}
                        onChange={e => handleChange("origin", e.target.value)}
                        required
                    />
                    <label htmlFor="dog-furType" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        Fur Type
                    </label>
                    <select
                        id="dog-furType"
                        aria-label="Dog Fur Type"
                        className="w-full border p-2 rounded text-black bg-white/80 focus:ring-2 focus:ring-sky-400"
                        value={dog.furType}
                        onChange={e => handleChange("furType", e.target.value)}
                        required
                    >
                        <option value="" className="text-black">Select Fur Type</option>
                        {furTypes.map((type) => (
                            <option key={type} value={type} className="text-black">{type}</option>
                        ))}
                    </select>
                    <label htmlFor="dog-country" className="block mb-1 font-semibold flex items-center gap-1 text-black">
                        Country
                    </label>
                    <select
                        id="dog-country"
                        aria-label="Country"
                        className="w-full border p-2 rounded text-black bg-white/80 focus:ring-2 focus:ring-sky-400"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                    >
                        {countryList.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                    {error && <div className="text-red-500 text-sm" aria-live="polite">{error}</div>}
                    {formError && <div className="text-red-500 text-sm mb-2" aria-live="polite">{formError}</div>}
                    {loading && (
                        <div className="flex items-center gap-2 text-sky-700 text-sm mb-2" aria-live="polite">
                            <svg className="animate-spin h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                            Validating city and country...
                        </div>
                    )}
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
                            aria-label="Go back"
                        >
                            ← Back
                        </button>
                        <button type="submit" className="flex-1 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 font-bold shadow focus:outline-none focus:ring-2 focus:ring-sky-400">Save Changes</button>
                    </div>
                </form>
            </div>
        </main>
    );
}
