"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api, CurrentUser } from "@/lib/client";

type NavLink = { href: string; label: string; blurb: string };
type NavGroup = { label: string; items: NavLink[] };

const TOOLS_GROUP: NavGroup = {
  label: "Resume Tools",
  items: [
    { href: "/resume-builder", label: "Resume Builder", blurb: "Generate an ATS-ready resume with AI" },
    { href: "/resume-analyzer", label: "Resume Analyzer", blurb: "Score and improve an existing resume" },
  ],
};

const LEARN_GROUP: NavGroup = {
  label: "Learn",
  items: [
    { href: "/courses", label: "Courses", blurb: "In-depth, instructor-led career courses" },
    { href: "/blog", label: "Blog", blurb: "Career and job-search guidance" },
  ],
};

const EARN_GROUP: NavGroup = {
  label: "Earn",
  items: [
    { href: "/invite", label: "Invite & Earn", blurb: "Get credits for inviting friends" },
    { href: "/refer", label: "Partner Program", blurb: "Earn commission as an affiliate" },
  ],
};

function NavDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        type="button"
        className={`nav-dropdown-trigger ${open ? "is-open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {group.label}
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
          <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={`nav-dropdown-panel ${open ? "is-open" : ""}`} role="menu">
        {group.items.map((item) => (
          <Link key={item.href} href={item.href} role="menuitem" onClick={() => setOpen(false)}>
            <span className="ndp-label">{item.label}</span>
            <span className="ndp-blurb">{item.blurb}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Nav() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    api<{ user: CurrentUser }>("/api/auth")
      .then((r) => setUser(r.user))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (user) api<{ balance: number }>("/api/payment?action=balance").then((r) => setCredits(r.balance)).catch(() => {});
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Link href="/" aria-label="Resumeefy home" className="brand-lockup" onClick={() => setOpen(false)}>
          <Image src="/brand/resumeefy-wordmark.png" alt="Resumeefy" width={174} height={40} priority />
        </Link>

        <nav aria-label="Primary navigation" className="desktop-nav">
          <Link href="/assessment" className="nav-flagship">
            Interview Prep
          </Link>
          <NavDropdown group={TOOLS_GROUP} />
          <NavDropdown group={LEARN_GROUP} />
          <NavDropdown group={EARN_GROUP} />
          <a href="#community">Community</a>
          {user?.role === "admin" && <Link href="/admin">Admin</Link>}
        </nav>

        <div className="nav-actions">
          {!loaded ? null : user ? (
            <>
              <Link href="/shop" className="nav-greeting">
                {credits === null ? "Credits" : `${credits} credits`} · Shop
              </Link>
              <span className="nav-greeting">Hi, {user.name.split(" ")[0]}</span>
              <button type="button" onClick={logout} className="nav-button nav-button-ghost">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-button nav-button-ghost">
                Log in
              </Link>
              <Link href="/signup" className="nav-button nav-button-primary">
                Sign up free
              </Link>
            </>
          )}
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="mobile-menu-inner">
          <Link href="/assessment" onClick={() => setOpen(false)}>
            Interview Prep <span>↗</span>
          </Link>
          <p className="mobile-menu-section">Resume tools</p>
          {TOOLS_GROUP.items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label} <span>↗</span>
            </Link>
          ))}
          <p className="mobile-menu-section">Learn</p>
          {LEARN_GROUP.items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label} <span>↗</span>
            </Link>
          ))}
          <p className="mobile-menu-section">Earn</p>
          {EARN_GROUP.items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label} <span>↗</span>
            </Link>
          ))}
          {user && (
            <Link href="/shop" onClick={() => setOpen(false)}>
              Credits & Shop <span>↗</span>
            </Link>
          )}
          <a href="#community" onClick={() => setOpen(false)}>
            Community <span>↓</span>
          </a>
          {user?.role === "admin" && (
            <Link href="/admin" onClick={() => setOpen(false)}>
              Admin <span>↗</span>
            </Link>
          )}
          {!user && loaded && (
            <Link href="/login" onClick={() => setOpen(false)}>
              Log in <span>↗</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
