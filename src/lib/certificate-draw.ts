// Draws the certificate on a canvas. The same drawing is shown on screen and saved as the PNG people download and share.
export type CertData = { id: string; name: string; course: string; date: string };

export const CERT_W = 1600;
export const CERT_H = 1131;

const FONT = '"Bricolage Grotesque","DM Sans",Arial,sans-serif';

function fit(ctx: CanvasRenderingContext2D, text: string, max: number, start: number, weight = 800) {
  let size = start;
  while (size > 22) { ctx.font = `${weight} ${size}px ${FONT}`; if (ctx.measureText(text).width <= max) break; size -= 2; }
  return size;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(" "); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

async function loadMark(): Promise<HTMLImageElement | null> {
  return new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = "/brand/resumeefy-mark.png"; });
}

export async function drawCertificate(canvas: HTMLCanvasElement, d: CertData, origin: string) {
  canvas.width = CERT_W; canvas.height = CERT_H;
  const ctx = canvas.getContext("2d")!;
  try { await Promise.all([document.fonts.load(`800 80px "DM Sans"`), document.fonts.load(`500 30px "DM Sans"`)]); } catch { /* use fallback fonts */ }

  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, CERT_W, CERT_H);
  // soft corner glows
  const g1 = ctx.createRadialGradient(CERT_W, 0, 0, CERT_W, 0, 520); g1.addColorStop(0, "rgba(255,215,0,0.35)"); g1.addColorStop(1, "rgba(255,215,0,0)");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, CERT_W, CERT_H);
  const g2 = ctx.createRadialGradient(0, CERT_H, 0, 0, CERT_H, 560); g2.addColorStop(0, "rgba(10,47,204,0.18)"); g2.addColorStop(1, "rgba(10,47,204,0)");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, CERT_W, CERT_H);

  // frame
  ctx.lineWidth = 18; ctx.strokeStyle = "#0A2FCC"; ctx.strokeRect(34, 34, CERT_W - 68, CERT_H - 68);
  ctx.lineWidth = 4; ctx.strokeStyle = "#FFD700"; ctx.strokeRect(66, 66, CERT_W - 132, CERT_H - 132);

  const mark = await loadMark();
  if (mark) ctx.drawImage(mark, 120, 118, 110, Math.round(110 * mark.height / mark.width));
  ctx.fillStyle = "#0A2FCC"; ctx.textAlign = "left"; ctx.font = `800 54px ${FONT}`; ctx.fillText("Resumeefy", 252, 190);

  ctx.textAlign = "center"; ctx.fillStyle = "#5d6b85"; ctx.font = `700 30px ${FONT}`;
  const kick = "CERTIFICATE OF COMPLETION"; let x = CERT_W / 2 - (kick.length * 22) / 2;
  ctx.textAlign = "left"; for (const ch of kick) { ctx.fillText(ch, x, 330); x += ctx.measureText(ch).width + 7; }
  ctx.textAlign = "center";

  ctx.fillStyle = "#000B1D"; ctx.font = `500 36px ${FONT}`; ctx.fillText("This certifies that", CERT_W / 2, 420);
  const ns = fit(ctx, d.name, CERT_W - 360, 112); ctx.font = `800 ${ns}px ${FONT}`; ctx.fillStyle = "#0A2FCC"; ctx.fillText(d.name, CERT_W / 2, 540);
  ctx.fillStyle = "#FFD700"; ctx.fillRect(CERT_W / 2 - 230, 575, 460, 6);

  ctx.fillStyle = "#000B1D"; ctx.font = `500 36px ${FONT}`; ctx.fillText("has successfully completed the course", CERT_W / 2, 650);
  const cs = fit(ctx, d.course, CERT_W - 360, 66); ctx.font = `800 ${cs}px ${FONT}`;
  const lines = cs > 40 ? [d.course] : wrap(ctx, d.course, CERT_W - 360);
  ctx.fillStyle = "#000B1D"; lines.forEach((l, i) => ctx.fillText(l, CERT_W / 2, 735 + i * (cs + 12)));

  const date = new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  ctx.fillStyle = "#5d6b85"; ctx.font = `600 30px ${FONT}`; ctx.textAlign = "left"; ctx.fillText(`Issued ${date}`, 140, CERT_H - 168);
  ctx.font = `600 26px ${FONT}`; ctx.fillText(`Certificate ID  ${d.id}`, 140, CERT_H - 122);
  ctx.fillStyle = "#0A2FCC"; ctx.font = `700 26px ${FONT}`; ctx.fillText(`Verify at ${origin.replace(/^https?:\/\//, "")}/certificate/${d.id}`.slice(0, 80), 140, CERT_H - 84);

  // gold seal
  const sx = CERT_W - 260, sy = CERT_H - 230;
  ctx.fillStyle = "#FFD700"; ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const r = i % 2 ? 92 : 108; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#0A2FCC"; ctx.beginPath(); ctx.arc(sx, sy, 72, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(sx - 30, sy + 2); ctx.lineTo(sx - 8, sy + 26); ctx.lineTo(sx + 34, sy - 22); ctx.stroke();
  ctx.fillStyle = "#5d6b85"; ctx.textAlign = "center"; ctx.font = `700 22px ${FONT}`; ctx.fillText("Better CV. Bigger Opportunities.", sx - 20, CERT_H - 84);
}

export function certCaption(c: { course: string }, url: string, site: string) {
  return `I just earned my "${c.course}" certificate on Resumeefy! 🎓\n\nResumeefy helps job seekers fix their resumes, practise interviews and prepare with aptitude tests. Start free: ${site}\n\nMy certificate: ${url}\n\n#Resumeefy #CareerGrowth #JobReady #InterviewPrep`;
}
export const linkedInShareUrl = (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
export function linkedInProfileUrl(c: CertData, url: string) {
  const d = new Date(c.date);
  const q = new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: c.course, organizationName: "Resumeefy", issueYear: String(d.getFullYear()), issueMonth: String(d.getMonth() + 1), certUrl: url, certId: c.id });
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
}
