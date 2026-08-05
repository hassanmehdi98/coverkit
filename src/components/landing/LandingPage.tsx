"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { LiveDemo } from "@/components/landing/LiveDemo";
import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { PresetPicker } from "@/components/preset-picker";
import { track } from "@/lib/analytics";

const CONTACT =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@coverkit.dev";
const TWITTER =
  process.env.NEXT_PUBLIC_TWITTER_URL ?? "https://x.com/coverkit";

function smoothScrollTo(hash: string) {
  document
    .querySelector(hash)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.pushState(null, "", hash);
}

export function LandingPage() {
  const { data: session } = useSession();

  useEffect(() => {
    track("landing_view");
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = window.setTimeout(() => {
      document
        .querySelector(hash)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="app-grid text-foreground">
      <section className="relative overflow-hidden">
        <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl flex-col px-5 pb-20 pt-14 md:px-8 md:pt-20">
          <div className="max-w-2xl">
            <p className="ck-section-label">Open Graph image API</p>
            <p className="mt-4 text-[clamp(2.75rem,7vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground">
              CoverKit
            </p>
            <h1 className="mt-5 max-w-xl text-xl font-medium tracking-[-0.02em] text-foreground/90 md:text-2xl">
              One template, every page its own image
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
              Design one template. Serve every page a unique OG image from a URL
              with query params — no rebuilds, no screenshot farm.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#start"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo("#start");
                }}
                className="ck-btn ck-btn-accent px-5 py-2.5 text-sm"
              >
                Design your card
              </a>
              <a
                href="#how"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo("#how");
                }}
                className="ck-btn ck-btn-secondary px-5 py-2.5 text-sm"
              >
                How it works
              </a>
            </div>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              free · no signup ·{" "}
              <span className="text-accent">{"{{title}}"}</span> in, PNG out
            </p>
          </div>

          <div className="mt-14 md:mt-16">
            <LiveDemo />
          </div>
        </div>
      </section>

      <div className="ck-hairline" />

      <section id="how" className="border-t border-border/60 bg-surface/60 px-5 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="ck-section-label">Workflow</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mt-2 max-w-lg text-muted">
            Design a template, copy the image URL, drop it in your meta tags.
          </p>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Design",
                body: "Lay out text, images, and variables on a 1200×630 canvas.",
                code: "{{title}}",
              },
              {
                step: "02",
                title: "Copy URL",
                body: "Get an image URL. Pass values in as query params.",
                code: "?title=…",
              },
              {
                step: "03",
                title: "Ship it",
                body: "Set og:image to that URL. Each page can pass its own values.",
                code: "og:image",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="bg-surface px-6 py-8 transition-colors hover:bg-surface-elevated"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-xs tracking-widest text-accent">
                    {item.step}
                  </p>
                  <code className="rounded-[var(--radius-sm)] border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] text-muted">
                    {item.code}
                  </code>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border px-5 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="ck-section-label">Preview</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
            Links with and without a card
          </h2>
          <p className="mt-2 max-w-lg text-muted">
            Same URL. One has a cover image in Slack and social feeds.
          </p>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <div className="ck-panel rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center justify-between">
                <p className="ck-label">Without</p>
                <span className="font-mono text-[10px] text-faint">null</span>
              </div>
              <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-border bg-surface-sunken p-4">
                <p className="text-sm text-muted-foreground">alex shared a link</p>
                <p className="mt-2 font-mono text-sm text-muted">
                  https://example.com/launch
                </p>
                <div className="mt-4 flex h-28 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface text-xs text-faint">
                  No preview image
                </div>
              </div>
            </div>

            <div className="ck-panel rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center justify-between">
                <p className="ck-label">With CoverKit</p>
                <span className="font-mono text-[10px] text-accent">og:image</span>
              </div>
              <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-elevated shadow-[var(--shadow-md)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/demo.png?title=Launch%20week%20is%20live"
                  alt="Link preview with cover image"
                  className="h-auto w-full"
                />
                <div className="border-t border-border p-4">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    example.com
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Launch week is live
                  </p>
                  <p className="mt-1 text-sm text-muted">
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
        className="border-t border-border bg-surface/60 px-5 py-24 md:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <p className="ck-section-label">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
            Start free. Upgrade when you ship.
          </h2>
          <p className="mt-2 max-w-lg text-muted">
            Free to design. Pro removes the watermark when you need it.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="ck-panel rounded-[var(--radius-lg)] p-6 md:p-8">
              <h3 className="text-sm font-medium text-muted">Free</h3>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold tracking-tight text-foreground">
                  $0
                </span>
              </p>
              <ul className="mt-8 space-y-3 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-accent">›</span> Full editor
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">›</span> Watermark on images
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">›</span> 50 renders / month
                </li>
              </ul>
              <a
                href="#start"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo("#start");
                }}
                className="ck-btn ck-btn-secondary mt-8 w-full"
              >
                Start designing
              </a>
            </div>

            <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-accent-border bg-accent-muted p-6 md:p-8">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
                aria-hidden
              />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-accent">Pro</h3>
                <span className="rounded-[var(--radius-sm)] border border-accent-border bg-surface/40 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                  waitlist
                </span>
              </div>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold tracking-tight text-foreground">
                  $12
                </span>
                <span className="text-sm text-muted">/mo</span>
              </p>
              <ul className="mt-8 space-y-3 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-accent">›</span> No watermark
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">›</span> 5,000 renders / month
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">›</span> Multiple templates
                </li>
              </ul>
              <WaitlistForm source="pricing_pro" />
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="border-t border-border px-5 py-24 md:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="ck-section-label">Get started</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
            Design your card
          </h2>
          <p className="mt-2 text-muted">
            Pick a starter. Opens the editor — no account required.
          </p>
          <div className="mt-8">
            <PresetPicker ctaLabel="Opens the editor" />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="ck-logo-mark" aria-hidden>
              CK
            </span>
            <span className="font-medium text-foreground">CoverKit</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted">
            <a
              className="font-mono transition-colors hover:text-foreground"
              href={`mailto:${CONTACT}`}
            >
              {CONTACT}
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href={TWITTER}
              target="_blank"
              rel="noreferrer"
            >
              Twitter / X
            </a>
            {session?.user ? (
              <Link
                className="transition-colors hover:text-foreground"
                href="/dashboard"
              >
                Dashboard
              </Link>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
