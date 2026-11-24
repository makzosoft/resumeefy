import { db } from "@/lib/db";
import { getCourseBySlug } from "@/lib/courses-content";

export type CertInfo = { id: string; name: string; course: string; date: string };

// Course certificates point at either a built in course (by slug) or a course the user generated.
export async function courseTitle(courseId: string): Promise<string> {
  try {
    const { data } = await db.from("courses").select("title").eq("id", courseId).maybeSingle();
    if ((data as { title?: string } | null)?.title) return String((data as { title: string }).title);
  } catch { /* fall through */ }
  try { const c = getCourseBySlug(courseId); if (c?.title) return c.title; } catch { /* fall through */ }
  return "Resumeefy course";
}

export async function getCertificateById(certificateId: string): Promise<CertInfo | null> {
  const id = String(certificateId || "").trim().slice(0, 60);
  if (!/^[A-Za-z0-9-]{6,60}$/.test(id)) return null;
  const { data } = await db.from("course_certificates").select("certificate_id,course_id,user_id,created_at").eq("certificate_id", id).maybeSingle();
  if (!data) return null;
  const row = data as { certificate_id: string; course_id: string; user_id: string; created_at: string };
  const { data: u } = await db.from("users").select("name").eq("id", row.user_id).maybeSingle();
  return { id: row.certificate_id, name: String((u as { name?: string } | null)?.name || "Resumeefy learner"), course: await courseTitle(row.course_id), date: row.created_at };
}

export async function getUserCertificates(userId: string, name: string): Promise<CertInfo[]> {
  const { data } = await db.from("course_certificates").select("certificate_id,course_id,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  const rows = (data as { certificate_id: string; course_id: string; created_at: string }[]) || [];
  return Promise.all(rows.map(async (r) => ({ id: r.certificate_id, name, course: await courseTitle(r.course_id), date: r.created_at })));
}
