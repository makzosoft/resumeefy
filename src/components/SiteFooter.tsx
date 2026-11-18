import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="lp-foot">
      <div className="lp-wrap">
        <div className="lp-foot-grid">
          <div className="lp-foot-brand">
            <div className="lp-logo"><Image src="/brand/resumeefy-mark.png" alt="" width={34} height={27} /> Resumeefy</div>
            <p>Better CV. Bigger Opportunities.</p>
          </div>
          <div>
            <h4>Tools</h4>
            <ul>
              <li><Link href="/assessment">Interview Prep</Link></li>
              <li><Link href="/resume-builder">Resume Builder</Link></li>
              <li><Link href="/resume-analyzer">Resume Analyzer</Link></li>
            </ul>
          </div>
          <div>
            <h4>Learn and earn</h4>
            <ul>
              <li><Link href="/courses">Courses</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/invite">Invite and Earn</Link></li>
              <li><Link href="/refer">Partner Program</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/contact">Contact us</Link></li>
              <li><Link href="/login">Log in</Link></li>
              <li><Link href="/signup">Sign up free</Link></li>
            </ul>
          </div>
        </div>
        <div className="lp-copy">© 2026 Resumeefy. Built for ambitious job seekers.</div>
      </div>
    </footer>
  );
}
