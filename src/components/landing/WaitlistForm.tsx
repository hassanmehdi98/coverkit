"use client";

import { useState } from "react";

import { track } from "@/lib/analytics";

export function WaitlistForm({ source = "pricing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
    });

    if (!res.ok) {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
      return;
    }

    track("waitlist_signup", { source });
    setStatus("ok");
    setMessage("Added. We will email you when Pro opens.");
    setEmail("");
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-teal-700/40"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
      >
        {status === "loading" ? "Submitting..." : "Join the waitlist"}
      </button>
      {message ? (
        <p
          className={`sm:basis-full text-sm ${status === "error" ? "text-red-600" : "text-teal-800"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
