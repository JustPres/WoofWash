"use client";
import { useContext, useEffect, useState } from "react";
import { subscribeUserToPush, unsubscribeUserFromPush } from "@/utils/notifications";
import { LanguageContext } from "@/app/layout";
import Link from "next/link";

const languages = [
	{ code: "en", label: "English" },
	{ code: "fil", label: "Filipino" },
	{ code: "ja", label: "日本語" },
];

const translations: Record<string, any> = {
	en: {
		title: "Bath Schedule App",
		welcome:
			"Welcome! Start by adding your dog info to get personalized bath schedules.",
		getStarted: "Get Started",
		viewSchedule: "View Schedule",
		language: "Language:",
	},
	fil: {
		title: "App ng Iskedyul ng Paliligo",
		welcome:
			"Maligayang pagdating! Simulan sa pagdagdag ng impormasyon ng iyong aso para sa personalisadong iskedyul ng paliligo.",
		getStarted: "Simulan",
		viewSchedule: "Tingnan ang Iskedyul",
		language: "Wika:",
	},
	ja: {
		title: "犬の入浴スケジュールアプリ",
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

	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			setNotifEnabled(Notification.permission === 'granted');
		}
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
		} catch (err: any) {
			setNotifError(err?.message || 'Notification error');
		} finally {
			setNotifLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4" aria-label="Home page main content">
			<div className="absolute top-4 right-4 flex items-center gap-4">
				<label
					htmlFor="lang-picker"
					className="mr-2 text-sky-800 font-semibold"
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
					className={`ml-4 px-4 py-2 rounded transition font-semibold shadow border focus:outline-none focus:ring-2 focus:ring-sky-400 ${notifEnabled ? 'bg-green-200 text-green-900 border-green-400 hover:bg-green-300' : 'bg-sky-200 text-sky-900 border-sky-400 hover:bg-sky-300'} ${notifLoading ? 'opacity-60 cursor-wait' : ''}`}
					aria-pressed={notifEnabled}
					aria-label={notifEnabled ? 'Disable notifications' : 'Enable notifications'}
					disabled={notifLoading}
				>
					{notifEnabled ? '🔔 Notifications On' : '🔕 Enable Notifications'}
				</button>
			</div>
			{notifError && <div className="text-red-600 mt-2">{notifError}</div>}
			<h1 className="text-3xl font-bold mb-2 text-sky-900" tabIndex={0} aria-label={t.title}>
				{t.title}
			</h1>
			<p className="mb-6 text-sky-800" tabIndex={0} aria-label={t.welcome}>
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
		</main>
	);
}