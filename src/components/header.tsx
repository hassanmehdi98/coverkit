"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";

export function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
          CoverKit
        </Link>

        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-sm text-zinc-400">...</span>
          ) : session?.user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm text-zinc-700 hover:bg-zinc-100"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium">
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
                  className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-zinc-200 bg-white py-1 shadow-sm"
                >
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
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
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
