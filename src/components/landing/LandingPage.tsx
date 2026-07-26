"use client";

import Link from "next/link";
import { useEffect } from "react";

import { LiveDemo } from "@/components/landing/LiveDemo";
import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { PresetPicker } from "@/components/preset-picker";
import { track } from "@/lib/analytics";

const BUILT_BY = process.env.NEXT_PUBLIC_BUILT_BY ?? "Hassan";
const CONTACT =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@coverkit.dev";
const TWITTER =
  process.env.NEXT_PUBLIC_TWITTER_URL ?? "https://x.com/coverkit";

export function LandingPage() {
  useEffect(() => {
    track("landing_view");
  }, []);

  return (
    <div className="landing-root font-[family-name:var(--font-landing-sans)] text-[color:var(--landing-ink)]">
      <section className="landing-hero relative min-h-[100svh] overflow-hidden">
        <div className="landing-hero-bg absolute inset-0" aria-hidden />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-16 pt-10 md:px-8">
          <p className="landing-brand font-[family-name:var(--font-landing-display)] text-5xl tracking-tight text-white md:text-7xl">
            CoverKit
          </p>

          <div className="mt-8 grid flex-1 items-center gap-10 lg:mt-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-14">
            <div className="landing-fade-up max-w-xl">
              <h1 className="font-[family-name:var(--font-landing-display)] text-3xl leading-tight text-white md:text-5xl">
                Every page deserves its own social card
              </h1>
              <p className="mt-4 max-w-md text-lg text-[color:var(--landing-muted)]">
                Build an Open Graph template once, then generate images from a
                URL with query params for each page.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#start"
                  className="landing-cta inline-flex items-center rounded-md bg-[color:var(--landing-accent)] px-5 py-3 text-sm font-semibold text-[#042f2e] transition hover:brightness-110"
                >
                  Design your card (free, no signup)
                </a>
              </div>
            </div>

            <div className="landing-fade-up landing-fade-up-delay">
              <LiveDemo />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-[#f7f6f2] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl text-zinc-900 md:text-4xl">
            How it works
          </h2>
          <p className="mt-2 max-w-lg text-zinc-600">
            Design a template, copy the image URL, put it in your meta tags.
          </p>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Design",
                body: "Lay out text, images, and variables on a 1200×630 canvas.",
              },
              {
                step: "02",
                title: "Copy URL",
                body: "Get an image URL. Pass values in as query params.",
              },
              {
                step: "03",
                title: "Use it anywhere",
                body: "Set og:image to that URL. Each page can pass its own title and images.",
              },
            ].map((item) => (
              <li key={item.step}>
                <p className="font-mono text-xs tracking-widest text-teal-800">
                  {item.step}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-landing-display)] text-2xl text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-zinc-600">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl text-zinc-900 md:text-4xl">
            Links with and without a preview
          </h2>
          <p className="mt-2 max-w-lg text-zinc-600">
            Same link. One has a cover image in Slack and social feeds.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Without
              </p>
              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
                <p className="text-sm text-zinc-500">alex shared a link</p>
                <p className="mt-2 text-sky-700 underline">
                  https://example.com/launch
                </p>
                <p className="mt-3 text-sm text-zinc-400">No preview image</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                With CoverKit
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/demo.png?title=Launch%20week%20is%20live"
                  alt="Link preview with cover image"
                  className="h-auto w-full"
                />
                <div className="p-4">
                  <p className="text-sm text-zinc-500">example.com</p>
                  <p className="mt-1 font-medium text-zinc-900">
                    Launch week is live
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Image rendered from a CoverKit template URL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="border-t border-zinc-200 bg-[#0f172a] px-5 py-20 text-white md:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl md:text-4xl">
            Pricing
          </h2>
          <p className="mt-2 max-w-lg text-slate-300">
            Free to start. Pro removes the watermark when you need it.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-1 text-3xl font-semibold">$0</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li>Editor</li>
                <li>Watermark on images</li>
                <li>50 renders per month</li>
              </ul>
              <a
                href="#start"
                className="mt-8 inline-flex rounded-md border border-white/25 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                Start designing
              </a>
            </div>

            <div className="border border-teal-400/40 bg-teal-950/40 p-6">
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="mt-1 text-3xl font-semibold">
                $12<span className="text-base font-normal text-slate-300">/mo</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li>No watermark</li>
                <li>5,000 renders per month</li>
                <li>Multiple templates</li>
              </ul>
              <WaitlistForm source="pricing_pro" />
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="border-t border-zinc-200 bg-[#f7f6f2] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl text-zinc-900 md:text-4xl">
            Design your card
          </h2>
          <p className="mt-2 text-zinc-600">
            Choose a starter template. No account needed.
          </p>
          <div className="mt-8">
            <PresetPicker ctaLabel="Opens the editor" />
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Built by {BUILT_BY}</p>
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-zinc-900" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
            <a
              className="hover:text-zinc-900"
              href={TWITTER}
              target="_blank"
              rel="noreferrer"
            >
              Twitter / X
            </a>
            <Link className="hover:text-zinc-900" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
