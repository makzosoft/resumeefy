"use client";
import { useEffect } from "react";

const COIN = '<svg width="26" height="26" viewBox="0 0 32 32"><defs><linearGradient id="cfx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD35A"/><stop offset="1" stop-color="#FFA53D"/></linearGradient></defs><circle cx="16" cy="16" r="15" fill="url(#cfx)" stroke="#B8790F" stroke-width="1.2"/><circle cx="16" cy="16" r="11" fill="none" stroke="#B8790F" stroke-width="1" opacity=".5"/><path d="M16 9.5c-1.9 0-3.3 1-3.3 2.3 0 3.1 6.2 1.9 6.2 5.1 0 1.4-1.5 2.4-3.3 2.4-1.5 0-2.8-.7-3.3-1.7M16 8v1.3M16 21.3v1.2" fill="none" stroke="#8A5600" stroke-width="1.6" stroke-linecap="round"/></svg>';

// Any part of the app can announce a credit award. Coins fly from where it happened to the credit total,
// and the total goes up a little every time a coin lands.
//   window.dispatchEvent(new CustomEvent("resumeefy:credits-award", { detail: { amount, balance, from } }))
export default function CreditAwardFx() {
  useEffect(() => {
    function onAward(e: Event) {
      const d = (e as CustomEvent<{ amount: number; balance: number; from?: DOMRect }>).detail;
      if (!d || typeof d.balance !== "number") return;
      const target = document.getElementById("credit-widget-anchor") || document.getElementById("nav-credits-anchor");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!target || reduce || !d.amount) { window.dispatchEvent(new CustomEvent("resumeefy:credits-updated", { detail: { balance: d.balance } })); return; }

      const t = target.getBoundingClientRect();
      const tx = t.left + t.width / 2, ty = t.top + t.height / 2;
      const sx = d.from ? d.from.left + d.from.width / 2 : window.innerWidth / 2;
      const sy = d.from ? d.from.top + d.from.height / 2 : window.innerHeight / 2;
      const n = Math.min(10, Math.max(4, Math.ceil(d.amount / 2)));
      const step = d.amount / n;
      let landed = 0;
      for (let i = 0; i < n; i++) {
        const el = document.createElement("div");
        el.innerHTML = COIN;
        el.style.cssText = "position:fixed;left:0;top:0;z-index:300;pointer-events:none;will-change:transform";
        document.body.appendChild(el);
        const jx = (Math.random() - 0.5) * 160, jy = -50 - Math.random() * 90;
        const a = el.animate([
          { transform: `translate(${sx - 13}px,${sy - 13}px) scale(.5)`, opacity: 0 },
          { transform: `translate(${sx - 13 + jx}px,${sy - 13 + jy}px) scale(1.15)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${tx - 13}px,${ty - 13}px) scale(.7)`, opacity: 1 },
        ], { duration: 950, delay: i * 110, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" });
        a.onfinish = () => {
          el.remove(); landed++;
          window.dispatchEvent(new CustomEvent("resumeefy:credits-tick", { detail: { delta: step, final: landed === n ? d.balance : undefined } }));
        };
      }
    }
    window.addEventListener("resumeefy:credits-award", onAward);
    return () => window.removeEventListener("resumeefy:credits-award", onAward);
  }, []);
  return null;
}
