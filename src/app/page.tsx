"use client";
import { useContext, useEffect, useState } from "react";
import { subscribeUserToPush, unsubscribeUserFromPush } from "@/utils/notifications";
import { LanguageContext } from "@/context/LanguageContext";
import Link from "next/link";
import { BellIcon as BellOutline, BellAlertIcon as BellSolid } from "@heroicons/react/24/outline";
import { getTimeOfDay, getTextColorClass, getTitleTextColorClass, type TimeOfDay } from "@/utils/timeOfDay";

const languages = [
	{ code: "en", label: "English" },
	{ code: "fil", label: "Filipino" },
	{ code: "ja", label: "日本語" },
];

const translations: Record<string, Record<string, string>> = {
	en: {
		title: "WoofWash",
		welcome:
			"Welcome! Start by adding your dog info to get personalized bath schedules.",
		getStarted: "Get Started",
		viewSchedule: "View Schedule",
		language: "Language:",
	},
	fil: {
		title: "WoofWash",
		welcome:
			"Maligayang pagdating! Simulan sa pagdagdag ng impormasyon ng iyong aso para sa personalisadong iskedyul ng paliligo.",
		getStarted: "Simulan",
		viewSchedule: "Tingnan ang Iskedyul",
		language: "Wika:",
	},
	ja: {
		title: "WoofWash",
		welcome:
			"ようこそ！犬の情報を追加して、パーソナライズされた入浴スケジュールを取得しましょう。",
		getStarted: "はじめる",
		viewSchedule: "スケジュールを見る",
		language: "言語:",
	},
};

export default function Home() {
	const { lang, setLang } = useContext(LanguageContext);
	const t = translations[lang] || translations.en;
	const [notifEnabled, setNotifEnabled] = useState(false);
	const [notifLoading, setNotifLoading] = useState(false);
	const [notifError, setNotifError] = useState<string | null>(null);
	const [showTipModal, setShowTipModal] = useState(false);
	const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			setNotifEnabled(Notification.permission === 'granted');
		}
	}, []);

	// Time of day effect
	useEffect(() => {
		setTimeOfDay(getTimeOfDay());
		const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setLang(e.target.value);
	};

	const handleNotifToggle = async () => {
		setNotifLoading(true);
		setNotifError(null);
		try {
			if (!notifEnabled) {
				await subscribeUserToPush();
				setNotifEnabled(true);
			} else {
				await unsubscribeUserFromPush();
				setNotifEnabled(false);
			}
		} catch (err) {
			if (err instanceof Error) {
				setNotifError(err.message);
			} else {
				setNotifError('Notification error');
			}
		} finally {
			setNotifLoading(false);
		}
	};

	return (
		<main className="min-h-screen flex flex-col items-center justify-center p-4" aria-label="Home page main content">
			<div className="absolute top-4 right-4 flex items-center gap-4">
				<label
					htmlFor="lang-picker"
					className={`language-label mr-2 ${getTextColorClass(timeOfDay)} font-semibold`}
					id="lang-picker-label"
				>
					{t.language}
				</label>
				<select
					id="lang-picker"
					value={lang}
					onChange={handleLangChange}
					className="rounded px-2 py-1 border border-sky-300 bg-white text-sky-900 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
					aria-labelledby="lang-picker-label"
				>
					{languages.map((l) => (
						<option key={l.code} value={l.code}>
							{l.label}
						</option>
					))}
				</select>
				<button
					type="button"
					onClick={handleNotifToggle}
					className={`notification-toggle ml-4 px-4 py-2 rounded transition font-semibold shadow border focus:outline-none focus:ring-2 focus:ring-sky-400 flex items-center gap-2 ${notifEnabled ? 'bg-green-200 text-green-900 border-green-400 hover:bg-green-300' : 'bg-sky-200 text-sky-900 border-sky-400 hover:bg-sky-300'} ${notifLoading ? 'opacity-60 cursor-wait' : ''}`}
					aria-pressed={notifEnabled}
					aria-label={notifEnabled ? 'Disable notifications' : 'Enable notifications'}
					disabled={notifLoading}
				>
					<span className="notification-icon">
						{notifEnabled ? (
							<BellSolid className="h-6 w-6" />
						) : (
							<BellOutline className="h-6 w-6" />
						)}
					</span>
					<span className="notification-text">
						{notifEnabled ? 'Notifications On' : 'Enable Notifications'}
					</span>
				</button>
			</div>
			{notifError && <div className="text-red-600 mt-2">{notifError}</div>}
			<h1 className={`text-3xl font-bold mb-2 ${getTitleTextColorClass(timeOfDay)}`} tabIndex={0} aria-label={t.title}>
				{t.title}
			</h1>
			<p className={`mb-6 ${getTextColorClass(timeOfDay)}`} tabIndex={0} aria-label={t.welcome}>
				{t.welcome}
			</p>
			<div className="flex gap-4">
				<Link
					href="/onboarding"
					className="px-6 py-3 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition focus:outline-none focus:ring-2 focus:ring-sky-400"
					aria-label="Get started with onboarding"
				>
					{t.getStarted}
				</Link>
				<Link
					href="/schedule"
					className="px-6 py-3 bg-sky-200 text-sky-900 rounded-lg shadow hover:bg-sky-300 transition focus:outline-none focus:ring-2 focus:ring-sky-400"
					aria-label="View bath schedule"
				>
					{t.viewSchedule}
				</Link>
			</div>

			{/* Tip the Dog Floating Button */}
			<button
				type="button"
				onClick={() => setShowTipModal(true)}
				className="fixed bottom-6 right-6 z-50 bg-white/60 backdrop-blur-md border border-white/40 shadow-xl w-16 h-16 flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 hover:bg-white/80 group cursor-pointer"
				aria-label="Tip the Dog"
			>
				<img src="/jar.png" alt="Tip Jar" className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12" />
			</button>

			{/* Tip Modal */}
			{showTipModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full flex flex-col items-center relative animate-fade-in">
						<button
							onClick={() => setShowTipModal(false)}
							className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl font-bold focus:outline-none cursor-pointer"
							aria-label="Cancel"
						>
							&times;
						</button>
						<img src="/qrcode.jpg" alt="GCash/Instapay QR code for WoofWash" className="w-full max-w-xs h-auto rounded mb-4 border border-gray-200" />
						<div className="text-lg font-bold text-sky-900 mb-2 text-center">Tip the Dog!</div>
						<div className="text-gray-700 text-center mb-2">Scan this QR code with your GCash or InstaPay app to send a tip. Thank you for supporting WoofWash!</div>
					</div>
				</div>
			)}
		</main>
	);
}