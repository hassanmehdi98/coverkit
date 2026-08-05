"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { track } from "@/lib/analytics";

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isEditor = Boolean(pathname?.startsWith("/t/") && pathname.includes("/edit"));

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function onHashNav(e: MouseEvent<HTMLAnchorElement>, hash: string) {
    if (pathname !== "/") return;
    const el = document.querySelector(hash);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", hash);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div
        className={`flex h-12 items-center justify-between px-4 ${
          isEditor ? "w-full" : "mx-auto max-w-6xl"
        }`}
      >
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <span className="ck-logo-mark" aria-hidden>
              CK
            </span>
            <span className="transition-colors group-hover:text-accent">CoverKit</span>
          </Link>

          {!isEditor ? (
            <nav className="hidden items-center gap-1 sm:flex">
              <a
                href="/#pricing"
                onClick={(e) => onHashNav(e, "#pricing")}
                className="rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                Pricing
              </a>
              <a
                href="/#start"
                onClick={(e) => onHashNav(e, "#start")}
                className="rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                Editor
              </a>
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  Dashboard
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <span className="font-mono text-xs text-muted-foreground">…</span>
          ) : session?.user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-[var(--radius-md)] py-1 pr-2 pl-1 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-6 w-6 rounded-[4px] border border-border"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-border bg-surface-elevated font-mono text-[10px] font-medium text-muted">
                    {(session.user.name ?? session.user.email ?? "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {session.user.name ?? session.user.email}
                </span>
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-elevated py-1 shadow-[var(--shadow-md)]"
                >
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                track("sign_in", { source: "header" });
                void signIn("google");
              }}
              className="ck-btn ck-btn-secondary !py-1.5"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
