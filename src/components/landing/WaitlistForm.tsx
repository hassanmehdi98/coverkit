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
    setMessage("You’re on the list. We’ll email when Pro opens.");
    setEmail("");
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="ck-input min-w-0 flex-1 font-mono text-sm"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="ck-btn ck-btn-accent"
      >
        {status === "loading" ? "Submitting…" : "Join waitlist"}
      </button>
      {message ? (
        <p
          className={`text-sm sm:basis-full ${status === "error" ? "text-danger" : "text-accent"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
