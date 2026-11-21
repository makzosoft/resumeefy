// The live address of the site. On Vercel the production domain is always right, even after a custom domain is added.
export function baseUrl(): string {
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL;
  if (prod) return `https://${prod}`.replace(/\/$/, "");
  return (env || "https://resumeefy.vercel.app").replace(/\/$/, "");
}
