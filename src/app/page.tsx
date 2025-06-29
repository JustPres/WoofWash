import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-2 text-sky-900">Bath Schedule App</h1>
      <p className="mb-6 text-sky-800">Welcome! Start by adding your dog info to get personalized bath schedules.</p>
      <div className="flex gap-4">
        <Link href="/onboarding" className="px-6 py-3 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition">Get Started</Link>
        <Link href="/schedule" className="px-6 py-3 bg-sky-200 text-sky-900 rounded-lg shadow hover:bg-sky-300 transition">View Schedule</Link>
      </div>
    </main>
  );
}