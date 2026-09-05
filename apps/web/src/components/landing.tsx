"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Globe } from "lucide-react";
import { ProductBrand } from "./product-brand";

const universities = [
  ["harvard", "Harvard University"],
  ["stanford", "Stanford University"],
  ["yale", "Yale University"],
  ["princeton", "Princeton University"],
  ["penn", "University of Pennsylvania"],
  ["cornell", "Cornell University"],
  ["brown", "Brown University"],
  ["dartmouth", "Dartmouth College"],
  ["berkeley", "UC Berkeley"],
  ["michigan", "University of Michigan"],
  ["texas", "University of Texas"],
  ["paris", "Université Paris Cité"],
  ["st-georges", "St. George's University"],
];
const previews = [
  { label: "Vey AI", image: "ai", href: "/ai" },
  { label: "Plan", image: "dashboard", href: "/" },
  {
    label: "Mocks (4 sections)",
    image: "tests-reading",
    href: "/tests/reading",
  },
  {
    label: "Detailed feedback",
    image: "statistics-reading",
    href: "/statistics?tab=reading",
  },
  {
    label: "Statistics",
    image: "statistics-overview",
    href: "/statistics?tab=overview",
  },
  { label: "Arcade", image: "arcade", href: "/arcade" },
  { label: "Vocabulary", image: "vocabulary", href: "/vocabulary" },
  { label: "Exam mode", image: "tests-reading", href: "/tests/reading" },
];
function StartLink({
  children = "Start preparing",
}: {
  children?: React.ReactNode;
}) {
  return (
    <Link className="landing-cta" href="/quiz?step=0">
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}

export function Landing() {
  const [selected, setSelected] = useState(0);
  const preview = previews[selected];
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-inner">
          <ProductBrand className="landing-brand" href="/welcome" />
          <nav aria-label="Page sections">
            <a href="#platform">Platform</a>
            <a href="#guarantee">Guarantee</a>
            <a href="#creator">Become a creator</a>
            <Link href="/arcade">Arcade</Link>
          </nav>
          <div className="landing-header-actions">
            <span className="landing-language">
              <Globe size={16} />
              EN
            </span>
            <Link href="/login">Log in</Link>
            <StartLink>Start</StartLink>
          </div>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1>Get the band score you want — on your first try</h1>
            <p>AI prep for Academic IELTS — 7 tools in one.</p>
            <div className="landing-hero-actions">
              <StartLink>Start preparation</StartLink>
              <a className="landing-cta secondary" href="#platform">
                Platform
              </a>
            </div>
            <a
              className="landing-idp"
              href="https://ielts.kz"
              target="_blank"
              rel="noreferrer"
            >
              <Image
                loading="eager"
                src="/reference/idp-partnership-register-here.png"
                width={560}
                height={178}
                alt="In partnership with IDP IELTS — Register Here"
              />
            </a>
          </div>
          <div className="landing-results">
            <div className="landing-band" aria-label="IELTS band 9.0">
              <span className="landing-laurel" aria-hidden="true" />
              <strong>9.0</strong>
              <span className="landing-laurel" aria-hidden="true" />
            </div>
            <div className="landing-certificates">
              <p>Real certificates from our students</p>
              <div>
                {[1, 2].map((number) => (
                  <Image
                    loading="eager"
                    key={number}
                    src={`/reference/cert-${number}.jpg`}
                    alt="IELTS certificate — student result from the reference"
                    width={560}
                    height={638}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        <section
          className="landing-universities"
          aria-label="Universities our students got into"
        >
          <p>Where our students got in:</p>
          <div className="landing-university-grid">
            {universities.map(([file, name]) => (
              <div key={file}>
                <Image
                  src={`/reference/${file}.png`}
                  alt={name}
                  width={280}
                  height={104}
                />
              </div>
            ))}
          </div>
        </section>
        <section id="platform" className="landing-section landing-platform">
          <h2>Take a look inside the platform</h2>
          <div className="landing-platform-layout">
            <div
              className="landing-platform-tabs"
              role="tablist"
              aria-orientation="vertical"
              aria-label="Platform features"
            >
              {previews.map((item, index) => (
                <button
                  key={item.label}
                  id={`preview-tab-${index}`}
                  role="tab"
                  aria-selected={selected === index}
                  aria-controls="platform-preview"
                  tabIndex={selected === index ? 0 : -1}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event) => {
                    const next =
                      event.key === "ArrowRight" || event.key === "ArrowDown"
                        ? (index + 1) % previews.length
                        : event.key === "ArrowLeft" || event.key === "ArrowUp"
                          ? (index + previews.length - 1) % previews.length
                          : event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? previews.length - 1
                              : null;
                    if (next !== null) {
                      event.preventDefault();
                      setSelected(next);
                      document.getElementById(`preview-tab-${next}`)?.focus();
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              className="landing-browser"
              id="platform-preview"
              role="tabpanel"
              aria-labelledby={`preview-tab-${selected}`}
            >
              <div className="landing-browser-bar">
                <i />
                <i />
                <i />
                <span>Veylo</span>
              </div>
              <Link href="/quiz?step=0" aria-label={`Try ${preview.label}`}>
                <Image
                  loading="eager"
                  className="landing-desktop-preview"
                  src={`/previews/${preview.image}-desktop.png`}
                  width={1440}
                  height={1000}
                  alt={preview.label}
                  unoptimized
                />
                <Image
                  loading="eager"
                  className="landing-mobile-preview"
                  src={`/previews/${preview.image}-mobile.png`}
                  width={390}
                  height={844}
                  alt={preview.label}
                  unoptimized
                />
              </Link>
            </div>
          </div>
          <div className="landing-section-cta">
            <StartLink />
          </div>
        </section>
        <section id="guarantee" className="landing-section landing-guarantee">
          <div className="landing-guarantee-card">
            <Image
              loading="eager"
              src="/reference/guarantee-badge.png"
              alt="100% Customer Satisfaction Guaranteed"
              width={448}
              height={448}
            />
            <div>
              <h2>Double result guarantee</h2>
              <p>Raise your score, or we refund you and cover your retake.</p>
              <p>We&apos;re confident in our AI — backed by 700,000+ users.</p>
              <div>
                <StartLink />
                <a
                  className="landing-cta secondary"
                  href="https://goprep.gg/guarantee"
                  target="_blank"
                  rel="noreferrer"
                >
                  Guarantee terms
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
          <section className="landing-faq">
            <h2>Frequently asked questions</h2>
            <div className="landing-faq-list">
              <details>
                <summary>
                  How is Veylo different from other platforms?
                  <ChevronDown size={16} />
                </summary>
                <p>
                  All your IELTS preparation is in one place: a personal study
                  plan, practice tests, detailed feedback, statistics,
                  vocabulary and speaking practice with Vey AI.
                </p>
              </details>
              <details>
                <summary>
                  What&apos;s covered by the &quot;double guarantee&quot;?
                  <ChevronDown size={16} />
                </summary>
                <p>
                  The reference offer includes a refund and a retake
                  contribution when its study and eligibility requirements are
                  met.{" "}
                  <a
                    href="https://goprep.gg/guarantee"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the original guarantee terms.
                  </a>
                </p>
              </details>
              <details>
                <summary>
                  Can I cancel my subscription?
                  <ChevronDown size={16} />
                </summary>
                <p>
                  Manage your access in Profile. Veylo currently uses invitation
                  access; you can sign out or delete your account from your
                  profile at any time.
                </p>
              </details>
            </div>
          </section>
        </section>
        <section className="landing-creator-section" id="creator">
          <div className="landing-section">
            <div className="landing-creator">
              <div>
                <h2>Become a UGC creator</h2>
                <p>Make short videos for GoPrep and get rewarded.</p>
              </div>
              <a
                className="landing-cta"
                href="https://creata.gg/en?utm_source=ielts.gg&utm_medium=referral&utm_campaign=landing_become_creator&utm_content=banner"
                target="_blank"
                rel="noreferrer"
              >
                Visit
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <p>
          Veylo is an independent preparation platform and is not affiliated
          with, endorsed by or certified by IELTS. IELTS® is a registered
          trademark of the British Council, IDP Education and Cambridge
          University Press &amp; Assessment; the name is used here only to
          identify the exam.
        </p>
        <p>
          Partnerships &amp; legal inquiries:{" "}
          <a href="mailto:support@ielts-orbit.app">support@ielts-orbit.app</a>
        </p>
        <nav aria-label="Legal">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <a href="https://goprep.gg/refund" target="_blank" rel="noreferrer">
            Refunds
          </a>
        </nav>
        <p className="landing-reference-note">
          Reference recreation: certificates, partner logos, creator materials
          and guarantee copy are from GoPrep. They do not establish an Veylo
          partnership or refund offer.
        </p>
      </footer>
    </div>
  );
}
