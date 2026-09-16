import Link from "next/link";

export default function HelpAccountPage() {
  return <main className="min-h-screen bg-app-bg px-6 py-24 text-app-text"><div className="mx-auto max-w-2xl"><Link href="/" className="text-neon-cyan">← Back home</Link><h1 className="mt-8 text-4xl font-bold">Help Center</h1><p className="mt-4 text-app-text/70">Need help with your NightVibe account? Start with the most common answers below.</p><div className="mt-8 space-y-4"><section className="glass-card p-5"><h2 className="font-semibold">Can&apos;t sign in?</h2><p className="mt-2 text-sm text-app-text/70">Double-check your email and password, then try again. If the issue continues, contact our team.</p></section><section className="glass-card p-5"><h2 className="font-semibold">Want to report an issue?</h2><p className="mt-2 text-sm text-app-text/70">Send us the page, device, and a short description through the contact page.</p></section></div></div></main>;
}

export const metadata = { title: "Help Center | NightVibe", description: "Find help for your NightVibe account." };

