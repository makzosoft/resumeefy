"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { api, CurrentUser } from "@/lib/client";

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
    if (user) api<{balance:number}>("/api/payment?action=balance").then(r => setCredits(r.balance)).catch(() => {});
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
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
          <Link href="/assessment">Assessment</Link>
          <Link href="/resume-analyzer">Resume Analyzer</Link>
          <Link href="/resume-builder">Resume Builder</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/blog">Blog</Link><Link href="/invite">Invite & earn</Link><Link href="/refer">Partner</Link>
          <a href="#community">Community</a>
          {user?.role === "admin" && <Link href="/admin">Admin</Link>}
        </nav>

        <div className="nav-actions">
          {!loaded ? null : user ? (
            <>
              <Link href="/shop" className="nav-greeting">{credits === null ? "Credits" : `${credits} credits`} · Shop</Link><span className="nav-greeting">Hi, {user.name.split(" ")[0]}</span>
              <button type="button" onClick={logout} className="nav-button nav-button-ghost">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-button nav-button-ghost">Log in</Link>
              <Link href="/signup" className="nav-button nav-button-primary">Sign up free</Link>
            </>
          )}
          <button type="button" className="menu-toggle" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="mobile-menu-inner">
          <Link href="/assessment" onClick={() => setOpen(false)}>Assessment <span>↗</span></Link>
          <Link href="/resume-analyzer" onClick={() => setOpen(false)}>Resume Analyzer <span>↗</span></Link>
          <Link href="/resume-builder" onClick={() => setOpen(false)}>Resume Builder <span>↗</span></Link>
          <Link href="/courses" onClick={() => setOpen(false)}>Courses <span>↗</span></Link>
          <Link href="/blog" onClick={() => setOpen(false)}>Blog <span>↗</span></Link><Link href="/invite" onClick={() => setOpen(false)}>Invite friends <span>↗</span></Link><Link href="/refer" onClick={() => setOpen(false)}>Partner Program <span>↗</span></Link>
          {user && <Link href="/shop" onClick={() => setOpen(false)}>Credits & Shop <span>↗</span></Link>}
          <a href="#community" onClick={() => setOpen(false)}>Community <span>↓</span></a>
          {user?.role === "admin" && <Link href="/admin" onClick={() => setOpen(false)}>Admin <span>↗</span></Link>}
          {!loaded && null}
          {!user && loaded && <Link href="/login" onClick={() => setOpen(false)}>Log in <span>↗</span></Link>}
        </div>
      </div>
    </header>
  );
}
