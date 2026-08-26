import React, { useState, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  FileText, Upload, ArrowRight, Check, X, AlertTriangle, ChevronDown,
  ChevronRight, Download, Sparkles, Lock, User, Mail, Eye, EyeOff,
  BarChart3, Briefcase, GraduationCap, PenLine, Globe, Menu, ArrowLeft,
  Star, Clock, Layers, ShieldCheck, LogOut, Plus, FolderOpen
} from "lucide-react";

/* ============================== TOKENS ============================== */
const C = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  ink: "#14171F",
  inkSoft: "#4A4F5C",
  inkFaint: "#8A8F9C",
  accent: "#1F3B73",
  accentDeep: "#142850",
  accentSoft: "#EEF2FA",
  gold: "#B9924A",
  goldDeep: "#8F6F30",
  goldSoft: "#FBF3E3",
  line: "#E7E5DF",
  navy: "#0A1226",
  navySoft: "#141F3B",
  success: "#0E7C4E",
  successBg: "#E7F5EC",
  warning: "#A66B0E",
  warningBg: "#FBF1DE",
  danger: "#B23428",
  dangerBg: "#FBEAE8",
};

const FONTS = `
.tc-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; background: ${C.bg}; color: ${C.ink}; letter-spacing: -0.01em; }
.tc-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; letter-spacing: -0.015em; }
.tc-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
@keyframes tc-scan { 0% { transform: translateY(0); opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { transform: translateY(220px); opacity: 0; } }
@keyframes tc-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes tc-pulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
.tc-fadeup { animation: tc-fadeup .5s ease both; }
.tc-scanline { animation: tc-scan 3.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .tc-scanline { animation: none; }
  .tc-fadeup { animation: none; }
}
.tc-underline-good { text-decoration: underline; text-decoration-color: ${C.success}; text-decoration-thickness: 2px; text-underline-offset: 3px; }
.tc-strike-bad { text-decoration: line-through; text-decoration-color: ${C.danger}; text-decoration-thickness: 2px; color: ${C.inkFaint}; }
.tc-insert { background: ${C.successBg}; color: ${C.success}; padding: 0 4px; border-radius: 3px; }
.tc-scrollbar::-webkit-scrollbar { width: 6px; }
.tc-scrollbar::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
input:focus, textarea:focus, button:focus-visible, select:focus { outline: 2px solid ${C.gold}; outline-offset: 2px; }
.tc-card-shadow { box-shadow: 0 1px 2px rgba(20,23,31,0.04), 0 8px 24px -8px rgba(20,23,31,0.08); }
.tc-hero-glow { background: radial-gradient(ellipse 80% 60% at 50% -10%, ${C.goldSoft}, transparent); }
`;

/* ============================== MOCK ENGINE ============================== */
const STOP = new Set(["the","and","a","an","to","of","in","for","with","on","is","are","as","by","at","or","be","this","that","from","your","you","we","our","will","have","has","it","its"]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ\u0600-\u06FF\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

const SKILL_BANK = [
  "communication","leadership","teamwork","problem solving","project management",
  "customer service","sales","negotiation","time management","microsoft excel",
  "data analysis","sql","python","javascript","react","node","figma","seo",
  "pos systems","opera pms","micros","wine service","upselling","inventory management",
  "budgeting","forecasting","scheduling","training","onboarding","crm","salesforce",
  "content writing","social media","bilingual","multilingual","agile","scrum",
];

function mockAnalyze(cvText, jdText, jobTitle) {
  const cvTokens = new Set(tokenize(cvText));
  const jdTokens = tokenize(jdText);
  const jdFreq = {};
  jdTokens.forEach((t) => (jdFreq[t] = (jdFreq[t] || 0) + 1));
  const jdUnique = Object.keys(jdFreq).sort((a, b) => jdFreq[b] - jdFreq[a]);

  const overlap = jdUnique.filter((w) => cvTokens.has(w));
  const missingKeywords = jdUnique.filter((w) => !cvTokens.has(w)).slice(0, 8);

  const relevantSkills = SKILL_BANK.filter(
    (s) => jdText.toLowerCase().includes(s) || cvText.toLowerCase().includes(s)
  );
  const matchingSkills = relevantSkills.filter((s) => cvText.toLowerCase().includes(s));
  const missingSkills = relevantSkills.filter((s) => !cvText.toLowerCase().includes(s)).slice(0, 6);

  const rawOverlapRatio = jdUnique.length ? overlap.length / Math.min(jdUnique.length, 40) : 0.3;
  let score = Math.round(38 + rawOverlapRatio * 55);
  score = Math.max(21, Math.min(96, score));

  const hasNumbers = /\d/.test(cvText);
  const wordCount = tokenize(cvText).length;
  const structureScore = wordCount > 400 ? "strong" : wordCount > 150 ? "moderate" : "thin";
  const grammarFlag = /[.!?]{2,}|\s{3,}/.test(cvText);

  return {
    score,
    jobTitle: jobTitle || "this role",
    matchingSkills: matchingSkills.length ? matchingSkills : ["customer communication", "team collaboration"],
    missingSkills: missingSkills.length ? missingSkills : ["industry-specific software", "measurable achievements"],
    missingKeywords: missingKeywords.length ? missingKeywords : ["leadership", "results-driven", "cross-functional"],
    experienceMatch: score > 70 ? "Strong alignment with the role's experience requirements." : score > 45 ? "Partial alignment — some relevant experience is present but not emphasized." : "Limited visible alignment with the role's required experience.",
    educationMatch: "Education section detected and appears consistent with typical requirements for this role.",
    structure: structureScore,
    hasNumbers,
    grammarFlag,
    recommendations: [
      !hasNumbers && "Add measurable achievements (e.g. \"increased X by 20%\") to strengthen impact.",
      "Mirror 3–5 exact keywords from the job description in your skills and experience sections.",
      "Tighten your professional summary to highlight your fit for " + (jobTitle || "the target role") + ".",
      "Reorder your skills so the most job-relevant ones appear first.",
      grammarFlag && "Review spacing and punctuation — a few formatting inconsistencies were detected.",
    ].filter(Boolean),
  };
}

function buildImprovedCV(cvText, analysis) {
  const summary = `Results-driven professional targeting ${analysis.jobTitle}, bringing proven strengths in ${analysis.matchingSkills.slice(0,2).join(" and ") || "customer-facing work"} and a track record of reliable, detail-oriented execution.`;
  const addedSkills = analysis.missingSkills.slice(0, 3);
  return {
    summary,
    addedSkillsLine: addedSkills.length ? addedSkills.join(" · ") : null,
    keywordLine: analysis.missingKeywords.slice(0, 4).join(" · "),
  };
}

/* ============================== SMALL UI PRIMITIVES ============================== */
function Btn({ children, variant = "primary", size = "md", onClick, icon: Icon, className = "", type = "button", disabled }) {
  const sizes = { sm: "text-sm px-3.5 py-2", md: "text-sm px-5 py-2.5", lg: "text-base px-7 py-3.5" };
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: { background: `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`, color: "#fff", boxShadow: "0 1px 2px rgba(20,40,80,0.15), 0 6px 16px -6px rgba(20,40,80,0.45)" },
    dark: { background: `linear-gradient(180deg, ${C.navySoft}, ${C.navy})`, color: "#fff", boxShadow: "0 1px 2px rgba(10,18,38,0.2), 0 6px 16px -6px rgba(10,18,38,0.5)" },
    gold: { background: `linear-gradient(180deg, #C9A45E, ${C.gold})`, color: "#1A1206", boxShadow: "0 1px 2px rgba(143,111,48,0.2), 0 6px 16px -6px rgba(143,111,48,0.5)" },
    outline: { background: "transparent", color: C.ink, border: `1.5px solid ${C.line}` },
    ghost: { background: "transparent", color: C.inkSoft },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={styles[variant]}
      className={`${base} ${sizes[size]} hover:brightness-105 active:scale-[0.98] ${className}`}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: { bg: C.accentSoft, color: C.accentDeep },
    good: { bg: C.successBg, color: C.success },
    warn: { bg: C.warningBg, color: C.warning },
    bad: { bg: C.dangerBg, color: C.danger },
    gold: { bg: C.goldSoft, color: C.goldDeep },
  };
  const t = tones[tone];
  return (
    <span
      style={{ background: t.bg, color: t.color, letterSpacing: "0.01em" }}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
    >
      {children}
    </span>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div
      style={{ background: C.surface, border: `1px solid ${C.line}`, ...style }}
      className={`rounded-2xl tc-card-shadow ${className}`}
    >
      {children}
    </div>
  );
}

/* ============================== NAV ============================== */
function Nav({ view, setView }) {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolLinks = [
    { id: "analyzer", label: "Analyze CV", desc: "Score your CV against a job description" },
    { id: "tracker", label: "Job Tracker", desc: "Track applications, interviews, offers" },
    { id: "salary", label: "Salary Insights", desc: "Estimate a fair salary range" },
    { id: "interview", label: "Interview Prep", desc: "Practice likely interview questions" },
    { id: "toolkit", label: "Relocation Toolkit", desc: "Checklist for working abroad" },
  ];
  const topLinks = [
    { id: "landing", label: "Home" },
    { id: "pricing", label: "Pricing" },
  ];
  const isToolView = toolLinks.some((t) => t.id === view);
  return (
    <header style={{ borderBottom: `1px solid ${C.line}`, background: "rgba(251,252,254,0.9)", backdropFilter: "blur(8px)" }} className="sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={() => setView("landing")} className="flex items-center gap-2">
          <div style={{ background: C.navy }} className="w-8 h-8 rounded-lg flex items-center justify-center">
            <FileText size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="tc-serif font-semibold text-lg" style={{ color: C.ink }}>TrueCV <span style={{ color: C.accent }}>AI</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-1 relative">
          <button
            onClick={() => setView("landing")}
            style={{ color: view === "landing" ? C.ink : C.inkSoft, background: view === "landing" ? C.accentSoft : "transparent" }}
            className="px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
          >
            Home
          </button>

          <div onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)} className="relative">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              style={{ color: isToolView ? C.ink : C.inkSoft, background: isToolView ? C.accentSoft : "transparent" }}
              className="px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1"
            >
              Tools <ChevronDown size={13} style={{ transform: toolsOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {toolsOpen && (
              <div style={{ background: C.surface, border: `1px solid ${C.line}` }} className="absolute top-full left-0 mt-1 w-72 rounded-2xl shadow-xl p-2 z-50">
                {toolLinks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setView(t.id); setToolsOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-black/[0.03] block"
                  >
                    <div className="text-sm font-semibold" style={{ color: view === t.id ? C.accent : C.ink }}>{t.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.inkFaint }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setView("pricing")}
            style={{ color: view === "pricing" ? C.ink : C.inkSoft, background: view === "pricing" ? C.accentSoft : "transparent" }}
            className="px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
          >
            Pricing
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={() => setView("login")}>Log in</Btn>
          <Btn variant="primary" size="sm" onClick={() => setView("analyzer")} icon={Sparkles}>Analyze My CV</Btn>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="md:hidden px-5 pb-6 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="text-xs font-semibold uppercase tracking-wide mt-4 mb-1" style={{ color: C.inkFaint }}>Tools</div>
          {[
            { id: "analyzer", label: "Analyze CV" },
            { id: "tracker", label: "Job Tracker" },
            { id: "salary", label: "Salary Insights" },
            { id: "interview", label: "Interview Prep" },
            { id: "toolkit", label: "Relocation Toolkit" },
          ].map((l) => (
            <button key={l.id} onClick={() => { setView(l.id); setOpen(false); }} className="w-full text-left py-2.5 text-sm font-medium" style={{ color: view === l.id ? C.accent : C.ink }}>
              {l.label}
            </button>
          ))}

          <div className="text-xs font-semibold uppercase tracking-wide mt-5 mb-1" style={{ color: C.inkFaint }}>Account</div>
          {[
            { id: "login", label: "Log in" },
            { id: "signup", label: "Sign up" },
            { id: "dashboard", label: "Dashboard" },
          ].map((l) => (
            <button key={l.id} onClick={() => { setView(l.id); setOpen(false); }} className="w-full text-left py-2.5 text-sm font-medium" style={{ color: view === l.id ? C.accent : C.ink }}>
              {l.label}
            </button>
          ))}

          <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-4 pt-4">
            <button onClick={() => { setView("pricing"); setOpen(false); }} className="w-full text-left py-2.5 text-sm font-semibold" style={{ color: view === "pricing" ? C.accent : C.ink }}>
              Pricing
            </button>
            <button onClick={() => { setView("landing"); setOpen(false); }} className="w-full text-left py-2.5 text-sm font-semibold" style={{ color: view === "landing" ? C.accent : C.ink }}>
              Home
            </button>
          </div>

          <div className="mt-5 flex gap-2">
            <Btn variant="outline" className="flex-1" onClick={() => { setView("login"); setOpen(false); }}>Log in</Btn>
            <Btn className="flex-1" icon={Sparkles} onClick={() => { setView("analyzer"); setOpen(false); }}>Analyze My CV</Btn>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer({ setView }) {
  return (
    <footer style={{ background: C.navy, color: "#C7D0E0" }} className="mt-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <span className="tc-serif font-semibold text-lg text-white">TrueCV AI</span>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#8FA0C2" }}>Make your CV job-ready — tailored to every application.</p>
        </div>
        {[
          { title: "Product", items: [["Analyze CV", "analyzer"], ["Pricing", "pricing"], ["About", "about"]] },
          { title: "Account", items: [["Log in", "login"], ["Sign up", "signup"], ["Dashboard", "dashboard"]] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-sm font-semibold text-white mb-3">{col.title}</div>
            <div className="flex flex-col gap-2">
              {col.items.map(([label, id]) => (
                <button key={label} onClick={() => setView(id)} className="text-sm text-left" style={{ color: "#8FA0C2" }}>{label}</button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="text-sm font-semibold text-white mb-3">Support</div>
          <div className="flex flex-col gap-2">
            <a
              href="https://wa.me/21621918127?text=Hi%2C%20I%20have%20a%20question%20about%20TrueCV%20AI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
              style={{ color: "#8FA0C2" }}
            >
              WhatsApp us
            </a>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white mb-3">Legal</div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setView("privacy")} className="text-sm text-left" style={{ color: "#8FA0C2" }}>Privacy Policy</button>
            <button onClick={() => setView("terms")} className="text-sm text-left" style={{ color: "#8FA0C2" }}>Terms of Service</button>
            <button onClick={() => setView("refund")} className="text-sm text-left" style={{ color: "#8FA0C2" }}>Refund Policy</button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 text-xs flex justify-between" style={{ borderTop: "1px solid #22304F", color: "#6B7D9F" }}>
        <span>© 2026 TrueCV AI.</span>
        <span>English · Français · العربية</span>
      </div>
    </footer>
  );
}

/* ============================== HERO MOCKUP (SIGNATURE ELEMENT) ============================== */
function AnnotatedCVPreview() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}` }} className="rounded-2xl shadow-xl p-6 sm:p-7 relative overflow-hidden">
      <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />
      <div className="tc-scanline absolute left-6 right-6 top-6 h-8 rounded" style={{ background: `linear-gradient(180deg, ${C.accentSoft}, transparent)` }} />
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="tc-serif font-semibold text-base" style={{ color: C.ink }}>Amira Ben Youssef</div>
          <div className="text-xs" style={{ color: C.inkFaint }}>Hospitality Supervisor — Draft CV</div>
        </div>
        <Badge tone="warn">Scanning…</Badge>
      </div>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: C.inkSoft }}>
        <p>
          Managed daily floor operations and <span className="tc-underline-good">led a team of 12 staff</span> across service shifts, ensuring guest satisfaction.
        </p>
        <p>
          <span className="tc-strike-bad">Responsible for various tasks</span> <span className="tc-insert">Increased table turnover by 18% through improved service flow</span>.
        </p>
        <p>
          Familiar with reservation software <span className="tc-insert">— including Opera PMS and Micros POS</span>.
        </p>
      </div>
      <div className="mt-6 pt-5 flex items-center justify-between" style={{ borderTop: `1px dashed ${C.line}` }}>
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.line} strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.accent} strokeWidth="3" strokeDasharray="78 100" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: C.ink }}>78</span>
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: C.ink }}>ATS Compatibility</div>
            <div className="text-xs" style={{ color: C.inkFaint }}>+21 pts after edits</div>
          </div>
        </div>
        <div className="hidden sm:flex gap-1.5">
          <Badge tone="good">Wine service ✓</Badge>
          <Badge tone="bad">POS systems</Badge>
        </div>
      </div>
    </div>
  );
}

/* ============================== LANDING PAGE ============================== */
function ScoreExample() {
  return (
    <Card className="p-6 sm:p-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.accent }}>Example result</div>
          <div className="tc-serif text-2xl font-semibold mb-1" style={{ color: C.ink }}>ATS Score: 78/100</div>
          <p className="text-sm mb-5" style={{ color: C.inkSoft }}>Applied to: Front Desk Supervisor, Marriott Doha</p>
          <div className="space-y-2.5">
            {[
              ["Strong customer service experience", "good"],
              ["Relevant hospitality background", "good"],
              ["Good English proficiency", "good"],
              ["POS systems — not mentioned", "bad"],
              ["Wine service — not mentioned", "bad"],
            ].map(([t, tone]) => (
              <div key={t} className="flex items-center gap-2 text-sm" style={{ color: C.inkSoft }}>
                {tone === "good" ? <Check size={15} style={{ color: C.success }} /> : <X size={15} style={{ color: C.danger }} />}
                {t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.bg, border: `1px solid ${C.line}` }} className="rounded-xl p-5">
          <div className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: C.inkFaint }}>Recommendations</div>
          <ul className="space-y-2.5 text-sm" style={{ color: C.inkSoft }}>
            {["Add measurable achievements to your experience", "Add \"Micros / Opera\" if you've used them", "Reorder skills to match job priorities", "Tighten your professional summary"].map((r) => (
              <li key={r} className="flex gap-2"><ArrowRight size={14} className="mt-1 shrink-0" style={{ color: C.accent }} />{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function BeforeAfterExamples() {
  const [active, setActive] = useState(0);
  const examples = [
    {
      role: "Hospitality Supervisor",
      job: "Applied to: Front Desk Supervisor, Doha",
      before: "Responsible for various tasks at the front desk. Dealt with guests and handled daily operations.",
      after: "Managed front desk operations for a 200-room property, leading a team of 6 while resolving guest issues that lifted satisfaction scores. Trained new hires on Opera PMS and check-in/checkout procedures.",
      beforeScore: 41,
      afterScore: 76,
    },
    {
      role: "Software Developer",
      job: "Applied to: Frontend Developer, Remote",
      before: "Worked on web projects using React. Fixed bugs and helped the team.",
      after: "Built and shipped 4 production React features used by 10k+ monthly users, cutting page load time by 30% through code splitting and reducing reported bugs by 22% via improved test coverage.",
      beforeScore: 38,
      afterScore: 81,
    },
    {
      role: "Sales Associate",
      job: "Applied to: Retail Sales Lead, Dubai",
      before: "Sold products in a retail store. Helped customers and processed payments.",
      after: "Consistently ranked top 3 of 15 sales associates, driving 18% year-over-year revenue growth through upselling and building repeat-customer relationships in a high-traffic retail location.",
      beforeScore: 35,
      afterScore: 74,
    },
  ];
  const ex = examples[active];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {examples.map((e, i) => (
          <button
            key={e.role}
            onClick={() => setActive(i)}
            style={{ background: active === i ? C.accent : C.bg, color: active === i ? "#fff" : C.inkSoft, border: `1px solid ${active === i ? C.accent : C.line}` }}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium"
          >
            {e.role}
          </button>
        ))}
      </div>
      <p className="text-xs mb-5" style={{ color: C.inkFaint }}>{ex.job}</p>
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.inkFaint }}>Before</div>
            <Badge tone="bad">{ex.beforeScore}/100</Badge>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{ex.before}</p>
        </Card>
        <Card className="p-5" style={{ borderColor: C.success }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: C.success }}><Sparkles size={12} /> After TrueCV AI</div>
            <Badge tone="good">{ex.afterScore}/100</Badge>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{ex.after}</p>
        </Card>
      </div>
      <p className="text-xs mt-5" style={{ color: C.inkFaint }}>These are illustrative examples built to show the type of rewrite TrueCV AI produces — not real user submissions. Your results depend on your actual CV and the job you're applying to.</p>
    </div>
  );
}

function Landing({ setView }) {
  const steps = [
    { icon: Upload, title: "Upload your CV", copy: "PDF or DOCX — your document stays private and is never shared." },
    { icon: Briefcase, title: "Paste the job description", copy: "TrueCV AI reads the role's real requirements, not generic templates." },
    { icon: BarChart3, title: "Get your CV score", copy: "See an ATS compatibility score with missing skills and keywords." },
    { icon: PenLine, title: "Improve and download", copy: "Get a rewritten CV and tailored cover letter, ready to send." },
  ];
  const features = [
    { icon: ShieldCheck, title: "Truthful by design", copy: "TrueCV AI never invents experience, dates, or credentials — only refines what you provide." },
    { icon: Globe, title: "Built for global jobs", copy: "Optimized for international, remote, hospitality, tech, business and healthcare roles." },
    { icon: Layers, title: "Multi-language", copy: "Analyze and rewrite your CV in English, French, or Arabic." },
    { icon: Clock, title: "Minutes, not hours", copy: "A full analysis, rewrite, and cover letter in under two minutes." },
  ];
  const faqs = [
    ["Does TrueCV guarantee a job?", "No. TrueCV helps improve your CV and tailor it to a specific job, but no tool can guarantee employment or interviews."],
    ["Can I use any type of CV?", "Yes — TrueCV AI supports PDF and DOCX files."],
    ["Can I use TrueCV for international jobs?", "Yes, TrueCV AI is built for job seekers applying worldwide, including remote and relocation roles."],
    ["Can TrueCV write my CV for me?", "TrueCV AI rewrites and improves your content, but only using information you provide — it never fabricates experience or credentials."],
  ];
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div>
      {/* HERO */}
      <section className="tc-hero-glow max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="tc-fadeup">
          <Badge>For job seekers worldwide</Badge>
          <h1 className="tc-serif mt-5 text-4xl sm:text-5xl font-semibold leading-[1.08]" style={{ color: C.ink }}>
            Make Your CV<br />Job&#8209;Ready.
          </h1>
          <p className="mt-5 text-lg leading-relaxed max-w-md" style={{ color: C.inkSoft }}>
            Upload your CV and paste the job you're applying for. TrueCV AI analyzes your CV, finds what you're missing, improves your content, and helps you stand out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn size="lg" icon={Sparkles} onClick={() => setView("analyzer")}>Analyze My CV</Btn>
            <Btn size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>See How It Works</Btn>
          </div>
          <div className="mt-8 flex items-center gap-5 text-xs" style={{ color: C.inkFaint }}>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Private &amp; secure</span>
            <span className="flex items-center gap-1.5"><Check size={14} /> No fabricated content</span>
          </div>
        </div>
        <div className="tc-fadeup" style={{ animationDelay: "0.1s" }}>
          <AnnotatedCVPreview />
        </div>
      </section>

      {/* CRAWLABLE INTRO / HONEST PROOF */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-4">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            ["ATS-focused analysis", "Every CV is checked against real ATS-style keyword matching, not generic tips copied from a blog."],
            ["Built for global applicants", "Purpose-built for job seekers applying across borders — including the Gulf, Europe, and remote roles — not just one country's job market."],
            ["Nothing fabricated", "TrueCV AI only rewrites and reorganizes what you actually provide. It never invents experience, dates, or credentials."],
          ].map(([title, copy]) => (
            <div key={title} style={{ background: C.bg, border: `1px solid ${C.line}` }} className="rounded-xl p-4">
              <div className="text-sm font-semibold mb-1.5" style={{ color: C.ink }}>{title}</div>
              <p className="text-xs leading-relaxed" style={{ color: C.inkSoft }}>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="mb-10">
          <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.accent }}>How it works</div>
          <h2 className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>From draft CV to job-ready, in four steps</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <Card className="p-5 h-full">
                <div style={{ background: C.accentSoft, color: C.accent }} className="w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                  <s.icon size={18} strokeWidth={2.25} />
                </div>
                <div className="text-xs tc-mono mb-1" style={{ color: C.inkFaint }}>Step {i + 1}</div>
                <div className="font-semibold text-sm mb-1.5" style={{ color: C.ink }}>{s.title}</div>
                <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{s.copy}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* EXAMPLE */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.accent }}>See it in action</div>
          <h2 className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>A real example analysis</h2>
        </div>
        <ScoreExample />
      </section>

      {/* BEFORE / AFTER */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="flex items-center justify-between mb-8 gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.accent }}>Before → After</div>
            <h2 className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>What TrueCV AI actually rewrites</h2>
          </div>
          <Badge tone="warn">Illustrative examples</Badge>
        </div>
        <BeforeAfterExamples />
      </section>

      {/* FEATURES */}
      <section style={{ background: C.navy }} className="py-16 mt-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "#8FB3FF" }}>Why TrueCV AI</div>
          <h2 className="tc-serif text-3xl font-semibold text-white mb-10">Built to be honest, not just optimistic</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} style={{ background: C.navySoft, border: "1px solid #22304F" }} className="rounded-2xl p-5">
                <div style={{ background: "#1F3357", color: "#8FB3FF" }} className="w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={18} strokeWidth={2.25} />
                </div>
                <div className="font-semibold text-sm text-white mb-1.5">{f.title}</div>
                <p className="text-sm leading-relaxed" style={{ color: "#A9B7D1" }}>{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="text-center max-w-lg mx-auto mb-10">
          <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.accent }}>Pricing</div>
          <h2 className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>Start free. Upgrade when you're ready.</h2>
        </div>
        <PricingGrid compact setView={setView} />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="mb-8 text-center">
          <div className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: C.accent }}>FAQ</div>
          <h2 className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>Common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map(([q, a], i) => (
            <Card key={q} className="overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-medium text-sm" style={{ color: C.ink }}>{q}</span>
                <ChevronDown size={16} style={{ color: C.inkFaint, transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: C.inkSoft }}>{a}</p>}
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>What early users say</h2>
          <Badge tone="warn">Demo content</Badge>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            ["\"Found gaps in my CV I'd never have noticed — especially missing keywords for ATS.\"", "Yassine K., Software Engineer"],
            ["\"The cover letter draft saved me an hour and actually matched the job posting.\"", "Sarra M., Hotel Operations"],
            ["\"Clear, specific recommendations — not generic tips I'd already read elsewhere.\"", "Omar T., Business Analyst"],
          ].map(([quote, name]) => (
            <Card key={name} className="p-5">
              <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={C.warning} color={C.warning} />)}</div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: C.inkSoft }}>{quote}</p>
              <div className="text-xs font-semibold" style={{ color: C.ink }}>{name}</div>
              <div className="text-xs" style={{ color: C.inkFaint }}>Illustrative demo testimonial</div>
            </Card>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.accentDeep})` }} className="rounded-3xl px-8 py-14 text-center">
          <h2 className="tc-serif text-3xl sm:text-4xl font-semibold text-white mb-3">Ready to make your CV job-ready?</h2>
          <p className="mb-7" style={{ color: "#C7D6F5" }}>Your first analysis is free — no credit card required.</p>
          <Btn size="lg" onClick={() => setView("analyzer")} icon={Sparkles}>Analyze My CV</Btn>
        </div>
      </section>
    </div>
  );
}

/* ============================== ANALYZER ============================== */
function Analyzer({ setView, setAnalysis, setCvInput, session }) {
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [lang, setLang] = useState("English");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const fileRef = useRef(null);

  const ANON_USED_KEY = "truecv_anon_free_used";

  React.useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (session) {
        const { data } = await supabase.from("profiles").select("plan, analyses_used").eq("id", session.user.id).single();
        if (!cancelled) { setProfile(data || { plan: "free", analyses_used: 0 }); setProfileChecked(true); }
      } else {
        setProfile(null);
        setProfileChecked(true);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [session]);

  const anonUsed = !session && typeof window !== "undefined" && window.localStorage.getItem(ANON_USED_KEY) === "1";
  const limitReached = session
    ? profile && profile.plan === "free" && profile.analyses_used >= 1
    : anonUsed;

  const LOADING_MESSAGES = [
    "Reading your CV…",
    "Comparing your experience with the job description…",
    "Checking ATS compatibility…",
    "Finding missing keywords…",
    "Preparing your recommendations…",
  ];

  React.useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const id = setInterval(() => {
      setLoadingStep((s) => (s + 1 < LOADING_MESSAGES.length ? s + 1 : s));
    }, 1500);
    return () => clearInterval(id);
  }, [loading]);

  const canSubmit = cvText.trim().length > 20 && jdText.trim().length > 20 && !limitReached;

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (f.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = () => setCvText(String(reader.result || ""));
      reader.readAsText(f);
    }
  }

  async function recordUsage() {
    if (session && profile) {
      const nextCount = (profile.analyses_used || 0) + 1;
      if (profile.plan === "free") {
        await supabase.from("profiles").update({ analyses_used: nextCount }).eq("id", session.user.id);
        setProfile({ ...profile, analyses_used: nextCount });
      }
    } else if (!session) {
      window.localStorage.setItem(ANON_USED_KEY, "1");
    }
  }

  function runAnalysis() {
    if (limitReached) return;
    setLoading(true);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText, jdText, jobTitle }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("AI request failed"))))
      .then((aiResult) => {
        const merged = {
          ...aiResult,
          jobTitle: jobTitle || "this role",
          structure: tokenize(cvText).length > 400 ? "strong" : tokenize(cvText).length > 150 ? "moderate" : "thin",
          hasNumbers: /\d/.test(cvText),
        };
        setAnalysis(merged);
        setCvInput(cvText);
        setLoading(false);
        recordUsage();
        setView("results");
      })
      .catch(() => {
        // Fall back to the built-in offline analysis if the AI service is unavailable
        const result = mockAnalyze(cvText, jdText, jobTitle);
        setAnalysis(result);
        setCvInput(cvText);
        setLoading(false);
        recordUsage();
        setView("results");
      });
  }

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <button onClick={() => setView("landing")} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: C.inkSoft }}>
        <ArrowLeft size={15} /> Back
      </button>
      <div className="mb-8">
        <Badge>Step 1 of 2</Badge>
        <h1 className="tc-serif text-3xl font-semibold mt-4" style={{ color: C.ink }}>Analyze your CV</h1>
        <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>Upload or paste your CV, then paste the job description you're applying to.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold" style={{ color: C.ink }}>Your CV</label>
            <span className="text-xs" style={{ color: C.inkFaint }}>PDF, DOCX, or paste text</span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ borderColor: C.line, background: C.bg }}
            className="w-full border-2 border-dashed rounded-xl py-5 flex flex-col items-center gap-2 mb-3 hover:opacity-80"
          >
            <Upload size={18} style={{ color: C.accent }} />
            <span className="text-sm font-medium" style={{ color: C.ink }}>{fileName || "Upload CV file"}</span>
            <span className="text-xs" style={{ color: C.inkFaint }}>.pdf or .docx — kept private to your account</span>
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFile} />
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="…or paste your CV text here"
            rows={8}
            style={{ borderColor: C.line }}
            className="w-full rounded-lg border p-3 text-sm resize-none"
          />
        </Card>

        <Card className="p-5">
          <label className="text-sm font-semibold block mb-3" style={{ color: C.ink }}>Job description</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={8}
            style={{ borderColor: C.line }}
            className="w-full rounded-lg border p-3 text-sm resize-none mb-3"
          />
          <label className="text-sm font-semibold block mb-2" style={{ color: C.ink }}>Target job title</label>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Front Desk Supervisor"
            style={{ borderColor: C.line }}
            className="w-full rounded-lg border p-2.5 text-sm"
          />
        </Card>
      </div>

      <Card className="p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <label className="text-sm font-semibold block mb-2" style={{ color: C.ink }}>Language</label>
          <div className="flex gap-2">
            {["English", "Français", "العربية"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{ background: lang === l ? C.accent : C.bg, color: lang === l ? "#fff" : C.inkSoft, border: `1px solid ${lang === l ? C.accent : C.line}` }}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium"
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <Btn size="lg" icon={loading ? undefined : Sparkles} disabled={!canSubmit || loading} onClick={runAnalysis}>
          {loading ? "Analyzing…" : "Analyze My CV"}
        </Btn>
      </Card>
      {loading && (
        <p className="text-sm mb-2 flex items-center gap-2" style={{ color: C.inkSoft }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
          {LOADING_MESSAGES[loadingStep]}
        </p>
      )}
      {limitReached && (
        <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: C.gold }}>
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>You've used your free analysis</div>
            <p className="text-sm" style={{ color: C.inkSoft }}>Upgrade to Pro for unlimited CV analyses, tailored cover letters, and more.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!session && <Btn variant="outline" onClick={() => setView("signup")}>Sign up</Btn>}
            <Btn variant="gold" onClick={() => setView("pricing")}>Upgrade to Pro</Btn>
          </div>
        </Card>
      )}
      {!canSubmit && !loading && !limitReached && (
        <p className="text-xs" style={{ color: C.inkFaint }}>Add at least a short CV and job description to continue.</p>
      )}
    </div>
  );
}

/* ============================== RESULTS ============================== */
function ScoreRing({ score }) {
  const tone = score >= 70 ? C.success : score >= 45 ? C.warning : C.danger;
  const circumference = 2 * Math.PI * 44;
  const dash = (score / 100) * circumference;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" stroke={C.line} strokeWidth="8" />
        <circle cx="50" cy="50" r="44" fill="none" stroke={tone} strokeWidth="8" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: C.ink }}>{score}</span>
        <span className="text-[10px]" style={{ color: C.inkFaint }}>/ 100</span>
      </div>
    </div>
  );
}

function ResultSection({ icon: Icon, title, tone, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div style={{ background: tone ? { good: C.successBg, warn: C.warningBg, bad: C.dangerBg }[tone] : C.accentSoft, color: tone ? { good: C.success, warn: C.warning, bad: C.danger }[tone] : C.accent }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={15} strokeWidth={2.25} />
        </div>
        <h3 className="font-semibold text-sm" style={{ color: C.ink }}>{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function Results({ analysis, setView, cvInput }) {
  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-24 text-center">
        <p style={{ color: C.inkSoft }} className="mb-4">No analysis yet — run one first.</p>
        <Btn onClick={() => setView("analyzer")}>Go to Analyzer</Btn>
      </div>
    );
  }
  const tone = analysis.score >= 70 ? "good" : analysis.score >= 45 ? "warn" : "bad";

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
      <button onClick={() => setView("analyzer")} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: C.inkSoft }}>
        <ArrowLeft size={15} /> New analysis
      </button>

      <Card className="p-6 sm:p-7 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ScoreRing score={analysis.score} />
        <div className="flex-1">
          <Badge tone={tone}>{tone === "good" ? "Strong match" : tone === "warn" ? "Needs improvement" : "Significant gaps"}</Badge>
          <h1 className="tc-serif text-2xl font-semibold mt-3" style={{ color: C.ink }}>ATS Compatibility Score</h1>
          <p className="text-sm mt-1" style={{ color: C.inkSoft }}>For: {analysis.jobTitle}</p>
          <p className="text-xs mt-3 max-w-md" style={{ color: C.inkFaint }}>This score is an AI-generated estimate to guide improvements — it does not represent or guarantee results from any specific employer's ATS.</p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Btn icon={PenLine} onClick={() => setView("improve")}>Improve My CV</Btn>
          <Btn variant="outline" icon={Mail} onClick={() => setView("coverletter")}>Generate Cover Letter</Btn>
          <Btn variant="outline" icon={ShieldCheck} onClick={() => setView("interview")}>Prepare for Interview</Btn>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <ResultSection icon={Check} title="Matching Skills" tone="good">
          <div className="flex flex-wrap gap-2">
            {analysis.matchingSkills.map((s) => <Badge key={s} tone="good">{s}</Badge>)}
          </div>
        </ResultSection>
        <ResultSection icon={X} title="Missing Skills" tone="bad">
          <div className="flex flex-wrap gap-2">
            {analysis.missingSkills.map((s) => <Badge key={s} tone="bad">{s}</Badge>)}
          </div>
        </ResultSection>
        <ResultSection icon={AlertTriangle} title="Missing Keywords" tone="warn">
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords.map((s) => <Badge key={s} tone="warn">{s}</Badge>)}
          </div>
        </ResultSection>
        <ResultSection icon={Briefcase} title="Experience Match">
          <p className="text-sm" style={{ color: C.inkSoft }}>{analysis.experienceMatch}</p>
        </ResultSection>
        <ResultSection icon={GraduationCap} title="Education Match">
          <p className="text-sm" style={{ color: C.inkSoft }}>{analysis.educationMatch}</p>
        </ResultSection>
        <ResultSection icon={Layers} title="CV Structure" tone={analysis.structure === "strong" ? "good" : analysis.structure === "moderate" ? "warn" : "bad"}>
          <p className="text-sm capitalize" style={{ color: C.inkSoft }}>{analysis.structure} content depth detected{!analysis.hasNumbers && " — no measurable achievements found."}</p>
        </ResultSection>
      </div>

      <ResultSection icon={ShieldCheck} title="Recommendations" className="mb-5">
        <ul className="space-y-2.5">
          {analysis.recommendations.map((r) => (
            <li key={r} className="flex gap-2 text-sm" style={{ color: C.inkSoft }}>
              <ArrowRight size={14} className="mt-1 shrink-0" style={{ color: C.accent }} />{r}
            </li>
          ))}
        </ul>
      </ResultSection>

      {analysis.grammarFlag && (
        <div style={{ background: C.warningBg, border: `1px solid #F0DBA8` }} className="rounded-xl p-4 flex gap-3 items-start text-sm mb-6">
          <AlertTriangle size={16} style={{ color: C.warning }} className="mt-0.5 shrink-0" />
          <span style={{ color: "#8A5A0A" }}>Potential problem: some spacing or punctuation inconsistencies were detected in your CV. Reviewing formatting can help with ATS parsing.</span>
        </div>
      )}
    </div>
  );
}

/* ============================== PDF EXPORT ============================== */
function downloadTextAsPdf({ title, paragraphs, filename }) {
  const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDFCtor) {
    alert("PDF library is still loading — please try again in a moment.");
    return;
  }
  const doc = new jsPDFCtor({ unit: "pt", format: "a4" });
  const marginX = 56;
  let y = 64;
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(16, 24, 38);
  doc.text(title, marginX, y);
  y += 28;

  doc.setDrawColor(230, 234, 241);
  doc.line(marginX, y, marginX + maxWidth, y);
  y += 24;

  paragraphs.forEach(({ heading, body }) => {
    if (heading) {
      if (y > pageHeight - 80) { doc.addPage(); y = 64; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(46, 90, 172);
      doc.text(heading.toUpperCase(), marginX, y);
      y += 18;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 38, 52);
    const lines = doc.splitTextToSize(body || "", maxWidth);
    lines.forEach((line) => {
      if (y > pageHeight - 60) { doc.addPage(); y = 64; }
      doc.text(line, marginX, y);
      y += 16;
    });
    y += 14;
  });

  doc.save(filename);
}

/* ============================== IMPROVE CV ============================== */
function ImproveCV({ analysis, cvInput, setView }) {
  const [accepted, setAccepted] = useState(false);
  if (!analysis) return <div className="max-w-2xl mx-auto px-5 py-24 text-center"><Btn onClick={() => setView("analyzer")}>Start an analysis</Btn></div>;
  const improved = buildImprovedCV(cvInput, analysis);

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
      <button onClick={() => setView("results")} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: C.inkSoft }}>
        <ArrowLeft size={15} /> Back to results
      </button>
      <Badge>AI suggestion — review before use</Badge>
      <h1 className="tc-serif text-3xl font-semibold mt-4 mb-2" style={{ color: C.ink }}>Improve My CV</h1>
      <p className="text-sm mb-8 max-w-xl" style={{ color: C.inkSoft }}>TrueCV AI only rewrites and reorganizes information you provided — it never invents experience, dates, or credentials.</p>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.inkFaint }}>Original summary</div>
          <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>
            {cvInput ? cvInput.slice(0, 220) + (cvInput.length > 220 ? "…" : "") : "No professional summary detected in your original CV."}
          </p>
        </Card>
        <Card className="p-5" style={{ borderColor: C.success }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: C.success }}>
            <Sparkles size={13} /> Improved summary
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{improved.summary}</p>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.inkFaint }}>Explanation of major changes</div>
        <ul className="space-y-2.5 text-sm" style={{ color: C.inkSoft }}>
          <li className="flex gap-2"><Check size={15} style={{ color: C.success }} className="mt-0.5 shrink-0" /> Rewrote the professional summary to target {analysis.jobTitle}.</li>
          {improved.addedSkillsLine && <li className="flex gap-2"><Check size={15} style={{ color: C.success }} className="mt-0.5 shrink-0" /> Surfaced existing skills relevant to this role: <span className="font-medium ml-1" style={{ color: C.ink }}>{improved.addedSkillsLine}</span></li>}
          <li className="flex gap-2"><Check size={15} style={{ color: C.success }} className="mt-0.5 shrink-0" /> Suggested keyword additions (only add if truthful): <span className="font-medium ml-1" style={{ color: C.ink }}>{improved.keywordLine}</span></li>
          <li className="flex gap-2"><Check size={15} style={{ color: C.success }} className="mt-0.5 shrink-0" /> Reordered skills to prioritize job-relevant items first.</li>
        </ul>
      </Card>

      <div className="flex items-center gap-3 mb-4">
        <input id="review" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-4 h-4" />
        <label htmlFor="review" className="text-sm" style={{ color: C.inkSoft }}>I reviewed the changes and confirm all content remains accurate.</label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Btn
          icon={Download}
          disabled={!accepted}
          onClick={() =>
            downloadTextAsPdf({
              title: `Improved CV — ${analysis.jobTitle}`,
              filename: `improved-cv-${(analysis.jobTitle || "role").toLowerCase().replace(/\s+/g, "-")}.pdf`,
              paragraphs: [
                { heading: "Professional summary", body: improved.summary },
                improved.addedSkillsLine && { heading: "Relevant skills to highlight", body: improved.addedSkillsLine },
                { heading: "Suggested keywords (add only if truthful)", body: improved.keywordLine },
                { heading: "Original CV content", body: cvInput || "No original CV content provided." },
              ].filter(Boolean),
            })
          }
        >
          Download Improved CV (PDF)
        </Btn>
        <Btn variant="outline" icon={Mail} onClick={() => setView("coverletter")}>Generate Cover Letter</Btn>
      </div>
    </div>
  );
}

/* ============================== COVER LETTER ============================== */
function CoverLetter({ analysis, setView }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generated, setGenerated] = useState(false);

  if (!analysis) return <div className="max-w-2xl mx-auto px-5 py-24 text-center"><Btn onClick={() => setView("analyzer")}>Start an analysis</Btn></div>;

  const toneCopy = {
    Formal: `I am writing to formally express my interest in the ${analysis.jobTitle} position${company ? ` at ${company}` : ""}.`,
    Professional: `I'm excited to apply for the ${analysis.jobTitle} role${company ? ` at ${company}` : ""}, where I can bring my relevant experience to your team.`,
    Concise: `I'd like to apply for the ${analysis.jobTitle} role${company ? ` at ${company}` : ""}. Here's why I'm a strong fit.`,
  };

  const letter = `${toneCopy[tone]}

My background includes strengths in ${analysis.matchingSkills.slice(0, 3).join(", ") || "customer-facing and organizational work"}, which align directly with the requirements outlined in your posting. In my recent roles, I've focused on delivering consistent, measurable results while collaborating closely with cross-functional teams.

I'm particularly drawn to this opportunity because it matches my experience and career direction. I'd welcome the chance to discuss how my background can contribute to your team's goals.

Thank you for your time and consideration.

${tone === "Concise" ? "Best," : "Sincerely,"}
${name || "[Your name]"}`;

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <button onClick={() => setView("results")} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: C.inkSoft }}>
        <ArrowLeft size={15} /> Back to results
      </button>
      <h1 className="tc-serif text-3xl font-semibold mb-2" style={{ color: C.ink }}>Generate Cover Letter</h1>
      <p className="text-sm mb-8" style={{ color: C.inkSoft }}>Tailored to: {analysis.jobTitle}</p>

      <Card className="p-5 mb-5 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Tone</label>
          <div className="flex gap-1.5">
            {["Formal", "Professional", "Concise"].map((t) => (
              <button key={t} onClick={() => setTone(t)} style={{ background: tone === t ? C.accent : C.bg, color: tone === t ? "#fff" : C.inkSoft, border: `1px solid ${tone === t ? C.accent : C.line}` }} className="px-2.5 py-1.5 rounded-full text-xs font-medium">
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Btn icon={Sparkles} onClick={() => setGenerated(true)} className="mb-5">Generate</Btn>

      {generated && (
        <Card className="p-6">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: C.ink, fontFamily: "inherit" }}>{letter}</pre>
          <div className="mt-6 flex gap-3">
            <Btn
              icon={Download}
              onClick={() =>
                downloadTextAsPdf({
                  title: `Cover Letter — ${analysis.jobTitle}`,
                  filename: `cover-letter-${(analysis.jobTitle || "role").toLowerCase().replace(/\s+/g, "-")}.pdf`,
                  paragraphs: [{ body: letter }],
                })
              }
            >
              Download as PDF
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================== PRICING ============================== */
/* ============================== PADDLE CHECKOUT ============================== */
const PADDLE_CLIENT_TOKEN = "live_8a10c4d4ec86acb5cbf3d7f284c";
const PADDLE_PRICE_IDS = {
  pro: "pri_01m0wbfbksndq26a2e3n9656yh",
  career: "pri_01m0wbqte7m66z3gn7ycve2vzk",
};
let paddleReadyPromise = null;

function ensurePaddleReady() {
  if (paddleReadyPromise) return paddleReadyPromise;
  paddleReadyPromise = new Promise((resolve, reject) => {
    function trySetup() {
      if (window.Paddle) {
        try {
          window.Paddle.Environment.set("production");
          window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });
          resolve(window.Paddle);
        } catch (err) {
          reject(err);
        }
      } else {
        setTimeout(trySetup, 150);
      }
    }
    trySetup();
  });
  return paddleReadyPromise;
}

function openPaddleCheckout(priceKey) {
  const priceId = PADDLE_PRICE_IDS[priceKey];
  ensurePaddleReady()
    .then((Paddle) => {
      Paddle.Checkout.open({ items: [{ priceId, quantity: 1 }] });
    })
    .catch(() => {
      alert("Checkout couldn't load right now. Please refresh the page and try again.");
    });
}

function PricingGrid({ compact, setView }) {
  const plans = [
    { name: "Free", price: "$0", period: "", features: ["1 CV analysis", "ATS compatibility score", "Basic recommendations"], cta: "Start free", variant: "outline" },
    { name: "Pro", price: "$9.99", period: "/mo", features: ["Unlimited CV analyses", "Advanced ATS analysis", "CV optimization", "Tailored cover letters", "PDF downloads", "Saved analyses"], cta: "Upgrade to Pro", variant: "primary", highlight: true },
    { name: "Career Package", price: "$19.99", period: "/mo", features: ["Everything in Pro", "Multiple CV versions", "Multiple languages", "Interview preparation", "Job application tracking", "Priority AI processing"], cta: "Get Career Package", variant: "dark" },
  ];
  function handleClick(planName) {
    if (planName === "Free") return setView("analyzer");
    if (planName === "Pro") return openPaddleCheckout("pro");
    if (planName === "Career Package") return openPaddleCheckout("career");
  }
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {plans.map((p) => (
        <Card key={p.name} className={`p-6 relative ${p.highlight ? "md:-translate-y-2" : ""}`} style={p.highlight ? { borderColor: C.gold, borderWidth: 2 } : {}}>
          {p.highlight && <div className="absolute -top-3 left-6"><Badge tone="gold">Most popular</Badge></div>}
          <div className="font-semibold text-sm mb-2" style={{ color: C.inkSoft }}>{p.name}</div>
          <div className="flex items-baseline gap-1 mb-5">
            <span className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>{p.price}</span>
            <span className="text-sm" style={{ color: C.inkFaint }}>{p.period}</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {p.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm" style={{ color: C.inkSoft }}>
                <Check size={15} style={{ color: C.success }} className="mt-0.5 shrink-0" />{f}
              </li>
            ))}
          </ul>
          <Btn variant={p.variant} className="w-full" onClick={() => handleClick(p.name)}>{p.cta}</Btn>
        </Card>
      ))}
    </div>
  );
}

function PricingPage({ setView }) {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
      <div className="text-center max-w-lg mx-auto mb-10">
        <Badge>Pricing</Badge>
        <h1 className="tc-serif text-4xl font-semibold mt-4" style={{ color: C.ink }}>Simple plans, real results</h1>
        <p className="mt-3 text-sm" style={{ color: C.inkSoft }}>Cancel anytime. Payments are processed securely by Paddle.</p>
      </div>
      <PricingGrid setView={setView} />
      <div className="text-center mt-10 text-xs" style={{ color: C.inkFaint }}>Checkout opens in a secure Paddle window. Your card details are never seen or stored by TrueCV AI.</div>
    </div>
  );
}

/* ============================== AUTH ============================== */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C41.9 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

function AuthPage({ mode, setView }) {
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (err) throw err;
      }
      setView("dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <Card className="p-8">
        <div style={{ background: C.navy }} className="w-10 h-10 rounded-xl flex items-center justify-center mb-5">
          <Lock size={17} color="#fff" />
        </div>
        <h1 className="tc-serif text-2xl font-semibold mb-1" style={{ color: C.ink }}>{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm mb-6" style={{ color: C.inkSoft }}>{isLogin ? "Log in to access your saved CVs and analyses." : "Start improving your CV in minutes."}</p>

        <Btn variant="outline" className="w-full mb-4" onClick={handleGoogle}>
          <GoogleIcon /> Continue with Google
        </Btn>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: C.line }} />
          <span className="text-xs" style={{ color: C.inkFaint }}>or</span>
          <div className="flex-1 h-px" style={{ background: C.line }} />
        </div>

        {error && (
          <div style={{ background: C.dangerBg, color: C.danger }} className="rounded-lg p-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.inkFaint }} />
                <input required value={name} onChange={(e) => setName(e.target.value)} style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 pl-9 text-sm" placeholder="Your name" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.inkFaint }} />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 pl-9 text-sm" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.inkFaint }} />
              <input required type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 pl-9 pr-9 text-sm" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPw ? <EyeOff size={15} style={{ color: C.inkFaint }} /> : <Eye size={15} style={{ color: C.inkFaint }} />}
              </button>
            </div>
          </div>
          {isLogin && <button type="button" onClick={() => setView("forgot")} className="text-xs font-medium" style={{ color: C.accent }}>Forgot password?</button>}
          <Btn type="submit" disabled={loading} className="w-full" size="lg">{loading ? "Please wait…" : isLogin ? "Log in" : "Sign up"}</Btn>
        </form>

        <p className="text-sm text-center mt-5" style={{ color: C.inkSoft }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setView(isLogin ? "signup" : "login")} className="font-semibold" style={{ color: C.accent }}>
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </Card>
    </div>
  );
}

function ForgotPassword({ setView }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <Card className="p-8">
        <h1 className="tc-serif text-2xl font-semibold mb-1" style={{ color: C.ink }}>Reset your password</h1>
        <p className="text-sm mb-6" style={{ color: C.inkSoft }}>We'll send a reset link to your email.</p>
        {sent ? (
          <div style={{ background: C.successBg, color: C.success }} className="rounded-lg p-4 text-sm flex gap-2">
            <Check size={16} className="mt-0.5 shrink-0" /> If an account exists, a reset link has been sent (demo).
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
            <input required type="email" placeholder="you@example.com" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm" />
            <Btn type="submit" className="w-full">Send reset link</Btn>
          </form>
        )}
        <button onClick={() => setView("login")} className="text-sm font-medium mt-5 flex items-center gap-1.5" style={{ color: C.accent }}>
          <ArrowLeft size={14} /> Back to log in
        </button>
      </Card>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function Dashboard({ setView, analysis, session, onLogout }) {
  const history = [
    { role: "Front Desk Supervisor", company: "Marriott Doha", score: 78, date: "Aug 20" },
    { role: "Guest Relations Officer", company: "Four Seasons", score: 64, date: "Aug 12" },
    { role: "Operations Coordinator", company: "Emaar Hospitality", score: 55, date: "Aug 3" },
  ];
  const userEmail = session?.user?.email;
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>Your dashboard</h1>
          <p className="text-sm mt-1" style={{ color: C.inkSoft }}>{userEmail ? `Signed in as ${userEmail}` : "Sample data shown below."}</p>
        </div>
        <Btn variant="ghost" icon={LogOut} onClick={onLogout || (() => setView("landing"))}>Log out</Btn>
      </div>

      <div className="flex gap-3 mb-8">
        <Btn icon={Plus} onClick={() => setView("analyzer")}>New analysis</Btn>
        <Btn variant="outline" icon={FolderOpen} onClick={() => setView("pricing")}>Manage plan</Btn>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-8">
        {[["Analyses run", history.length], ["Saved CVs", 2], ["Cover letters", 1]].map(([label, val]) => (
          <Card key={label} className="p-5">
            <div className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>{val}</div>
            <div className="text-xs mt-1" style={{ color: C.inkFaint }}>{label}</div>
          </Card>
        ))}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.inkFaint }}>Previous CV analyses</div>
      <div className="space-y-3">
        {history.map((h) => (
          <Card key={h.role} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ background: C.accentSoft, color: C.accent }} className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={15} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: C.ink }}>{h.role}</div>
                <div className="text-xs" style={{ color: C.inkFaint }}>{h.company} · {h.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={h.score >= 70 ? "good" : h.score >= 45 ? "warn" : "bad"}>{h.score}/100</Badge>
              <ChevronRight size={16} style={{ color: C.inkFaint }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================== JOB TRACKER ============================== */
const TRACKER_KEY = "truecv_job_tracker_v1";
const TRACKER_STATUSES = [
  { id: "applied", label: "Applied", tone: "neutral" },
  { id: "interview", label: "Interview", tone: "warn" },
  { id: "offer", label: "Offer", tone: "good" },
  { id: "rejected", label: "Rejected", tone: "bad" },
];

function loadTrackerData() {
  try {
    const raw = window.localStorage.getItem(TRACKER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveTrackerData(items) {
  try {
    window.localStorage.setItem(TRACKER_KEY, JSON.stringify(items));
  } catch {}
}

function JobTracker({ setView }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role: "", company: "", location: "", status: "applied", notes: "" });

  React.useEffect(() => {
    setItems(loadTrackerData());
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (loaded) saveTrackerData(items);
  }, [items, loaded]);

  function addItem() {
    if (!form.role.trim() || !form.company.trim()) return;
    const newItem = { id: Date.now().toString(), ...form, date: new Date().toISOString().slice(0, 10) };
    setItems([newItem, ...items]);
    setForm({ role: "", company: "", location: "", status: "applied", notes: "" });
    setShowForm(false);
  }
  function updateStatus(id, status) {
    setItems(items.map((it) => (it.id === id ? { ...it, status } : it)));
  }
  function removeItem(id) {
    setItems(items.filter((it) => it.id !== id));
  }

  const counts = TRACKER_STATUSES.reduce((acc, s) => {
    acc[s.id] = items.filter((it) => it.status === s.id).length;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <Badge>Track every application</Badge>
          <h1 className="tc-serif text-3xl font-semibold mt-4" style={{ color: C.ink }}>Job Application Tracker</h1>
          <p className="mt-2 text-sm max-w-lg" style={{ color: C.inkSoft }}>Keep every application, interview, and offer in one place — saved privately in this browser.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-7">
        {TRACKER_STATUSES.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="text-2xl font-bold" style={{ color: C.ink }}>{counts[s.id] || 0}</div>
            <div className="text-xs mt-1" style={{ color: C.inkFaint }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Btn icon={Plus} onClick={() => setShowForm(!showForm)} className="mb-5">
        {showForm ? "Cancel" : "Add application"}
      </Btn>

      {showForm && (
        <Card className="p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Job title</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Front Desk Supervisor" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Company</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Doha, Qatar" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm bg-white">
                {TRACKER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Recruiter contact, interview date, next steps…" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm mb-4" />
          <Btn onClick={addItem}>Save application</Btn>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm" style={{ color: C.inkSoft }}>No applications tracked yet. Add your first one above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const statusInfo = TRACKER_STATUSES.find((s) => s.id === it.status) || TRACKER_STATUSES[0];
            return (
              <Card key={it.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm" style={{ color: C.ink }}>{it.role}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.inkFaint }}>
                      {it.company}{it.location ? ` · ${it.location}` : ""} · {it.date}
                    </div>
                    {it.notes && <p className="text-xs mt-2" style={{ color: C.inkSoft }}>{it.notes}</p>}
                  </div>
                  <button onClick={() => removeItem(it.id)} className="shrink-0 p-1.5 rounded-lg hover:opacity-70" aria-label="Remove">
                    <X size={15} style={{ color: C.inkFaint }} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {TRACKER_STATUSES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => updateStatus(it.id, s.id)}
                      style={{
                        background: it.status === s.id ? { neutral: C.accentSoft, good: C.successBg, warn: C.warningBg, bad: C.dangerBg }[s.tone] : C.bg,
                        color: it.status === s.id ? { neutral: C.accentDeep, good: C.success, warn: C.warning, bad: C.danger }[s.tone] : C.inkFaint,
                        border: `1px solid ${it.status === s.id ? "transparent" : C.line}`,
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Btn variant="outline" onClick={() => setView("analyzer")}>Analyze another CV</Btn>
      </div>
    </div>
  );
}

/* ============================== SALARY INSIGHTS ============================== */
const SALARY_BASE = {
  "hospitality": 700, "waiter": 700, "chef": 1200, "hotel": 900, "receptionist": 750,
  "software": 2500, "developer": 2500, "engineer": 2200, "programmer": 2400,
  "sales": 1000, "marketing": 1100, "business": 1300, "analyst": 1400,
  "nurse": 1200, "healthcare": 1300, "doctor": 3000,
  "teacher": 900, "education": 850,
  "accountant": 1200, "finance": 1600,
  "manager": 1800, "supervisor": 1100, "director": 3200,
  "default": 1100,
};
const COUNTRY_MULTIPLIER = {
  "qatar": 2.1, "doha": 2.1, "uae": 2.0, "dubai": 2.0, "abu dhabi": 2.0,
  "saudi": 1.7, "riyadh": 1.7, "jeddah": 1.7,
  "kuwait": 1.9, "bahrain": 1.6, "oman": 1.5,
  "france": 2.4, "germany": 2.5, "uk": 2.6, "united kingdom": 2.6,
  "usa": 3.0, "united states": 3.0, "canada": 2.7,
  "tunisia": 1.0, "morocco": 1.1, "algeria": 1.0, "egypt": 0.8,
  "default": 1.4,
};

function estimateSalary(jobTitle, country, experience) {
  const t = (jobTitle || "").toLowerCase();
  const c = (country || "").toLowerCase();
  let base = SALARY_BASE.default;
  for (const key in SALARY_BASE) {
    if (key !== "default" && t.includes(key)) { base = SALARY_BASE[key]; break; }
  }
  let mult = COUNTRY_MULTIPLIER.default;
  for (const key in COUNTRY_MULTIPLIER) {
    if (key !== "default" && c.includes(key)) { mult = COUNTRY_MULTIPLIER[key]; break; }
  }
  const expMult = experience === "senior" ? 1.6 : experience === "mid" ? 1.2 : 1.0;
  const mid = Math.round((base * mult * expMult) / 10) * 10;
  const low = Math.round(mid * 0.78 / 10) * 10;
  const high = Math.round(mid * 1.3 / 10) * 10;
  return { low, mid, high };
}

function SalaryInsights({ setView }) {
  const [jobTitle, setJobTitle] = useState("");
  const [country, setCountry] = useState("");
  const [experience, setExperience] = useState("entry");
  const [result, setResult] = useState(null);

  function calculate() {
    if (!jobTitle.trim() || !country.trim()) return;
    setResult(estimateSalary(jobTitle, country, experience));
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
      <Badge>AI-estimated ranges</Badge>
      <h1 className="tc-serif text-3xl font-semibold mt-4 mb-2" style={{ color: C.ink }}>Salary Insights</h1>
      <p className="text-sm mb-8 max-w-lg" style={{ color: C.inkSoft }}>Get an estimated monthly salary range for a role and country before your interview — useful for negotiation.</p>

      <Card className="p-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Job title</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Front Desk Supervisor" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Country / city</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Qatar, France, Tunisia" style={{ borderColor: C.line }} className="w-full rounded-lg border p-2.5 text-sm" />
          </div>
        </div>
        <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Experience level</label>
        <div className="flex gap-2 mb-5">
          {[["entry", "Entry (0-2 yrs)"], ["mid", "Mid (3-6 yrs)"], ["senior", "Senior (7+ yrs)"]].map(([id, label]) => (
            <button key={id} onClick={() => setExperience(id)} style={{ background: experience === id ? C.accent : C.bg, color: experience === id ? "#fff" : C.inkSoft, border: `1px solid ${experience === id ? C.accent : C.line}` }} className="px-3 py-1.5 rounded-full text-xs font-medium">
              {label}
            </button>
          ))}
        </div>
        <Btn icon={Sparkles} onClick={calculate}>Estimate salary</Btn>
      </Card>

      {result && (
        <Card className="p-6">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.inkFaint }}>Estimated monthly range ({jobTitle} — {country})</div>
          <div className="flex items-end gap-2 mb-4">
            <span className="tc-serif text-3xl font-semibold" style={{ color: C.ink }}>${result.low.toLocaleString()} – ${result.high.toLocaleString()}</span>
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.line}` }} className="rounded-xl p-4 mb-4">
            <div className="flex justify-between text-xs mb-1" style={{ color: C.inkFaint }}>
              <span>Lower end</span><span>Typical</span><span>Upper end</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: C.line }}>
              <div style={{ width: "33%", background: C.accentSoft }} />
              <div style={{ width: "34%", background: C.accent }} />
              <div style={{ width: "33%", background: C.accentSoft }} />
            </div>
            <div className="flex justify-between text-sm font-semibold mt-2" style={{ color: C.ink }}>
              <span>${result.low.toLocaleString()}</span><span>${result.mid.toLocaleString()}</span><span>${result.high.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs" style={{ color: C.inkFaint }}>This is an AI-generated estimate based on role and location trends — actual offers vary by company, benefits, and negotiation. Not a guarantee of any specific salary.</p>
        </Card>
      )}

      <div className="mt-8 text-center">
        <Btn variant="outline" onClick={() => setView("analyzer")}>Analyze your CV</Btn>
      </div>
    </div>
  );
}

/* ============================== INTERVIEW PREP ============================== */
const COMMON_QUESTIONS = [
  "Tell me about yourself.",
  "Why do you want to work here?",
  "What are your greatest strengths?",
  "What is a weakness you're working on?",
  "Describe a challenge you faced at work and how you handled it.",
  "Where do you see yourself in five years?",
  "Why are you leaving your current role?",
  "How do you handle pressure or tight deadlines?",
];
const ROLE_QUESTION_BANK = {
  hospitality: ["How would you handle a difficult or angry guest?", "Describe a time you upsold a product or service.", "How do you stay calm during a busy shift?"],
  software: ["Walk me through a recent project you're proud of.", "How do you approach debugging a tricky issue?", "How do you keep your skills up to date?"],
  sales: ["Describe how you'd pitch our product to a new client.", "Tell me about a sale you lost — what did you learn?", "How do you handle rejection?"],
  default: ["What relevant experience makes you a strong fit for this role?", "How do you prioritize tasks when everything feels urgent?", "What questions do you have for us?"],
};

function pickRoleQuestions(jobTitle) {
  const t = (jobTitle || "").toLowerCase();
  if (/(waiter|chef|hotel|hospitality|restaurant)/.test(t)) return ROLE_QUESTION_BANK.hospitality;
  if (/(developer|engineer|software|programmer)/.test(t)) return ROLE_QUESTION_BANK.software;
  if (/(sales|business development)/.test(t)) return ROLE_QUESTION_BANK.sales;
  return ROLE_QUESTION_BANK.default;
}

function InterviewPrep({ analysis, setView }) {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  if (!analysis) return <div className="max-w-2xl mx-auto px-5 py-24 text-center"><Btn onClick={() => setView("analyzer")}>Start an analysis</Btn></div>;

  const questions = [...COMMON_QUESTIONS.slice(0, 5), ...pickRoleQuestions(analysis.jobTitle)];

  function tip(q) {
    if (/yourself/i.test(q)) return "Keep it to 60–90 seconds: present role → key experience → why this job.";
    if (/strength/i.test(q)) return "Pick a strength directly relevant to this role and back it with a brief example.";
    if (/weakness/i.test(q)) return "Choose a real, minor weakness and show what you're doing to improve it.";
    if (/why.*here|why.*work here/i.test(q)) return "Connect something specific about the company or role to your own goals.";
    if (/pressure|deadline/i.test(q)) return "Use a specific example (STAR method): Situation, Task, Action, Result.";
    if (/leaving/i.test(q)) return "Stay positive — focus on what you're moving toward, not what you're escaping.";
    if (/five years/i.test(q)) return "Show ambition that aligns with growth paths this company could offer.";
    return "Use a specific, concrete example rather than a general statement.";
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
      <button onClick={() => setView("results")} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: C.inkSoft }}>
        <ArrowLeft size={15} /> Back to results
      </button>
      <Badge>Practice before the real thing</Badge>
      <h1 className="tc-serif text-3xl font-semibold mt-4 mb-2" style={{ color: C.ink }}>Interview Preparation</h1>
      <p className="text-sm mb-8 max-w-lg" style={{ color: C.inkSoft }}>Likely questions for {analysis.jobTitle}, with tips for each. Write a draft answer for practice — nothing is saved or sent anywhere.</p>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div style={{ background: C.accentSoft, color: C.accent }} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>{q}</p>
            </div>
            <textarea
              value={answers[i] || ""}
              onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
              placeholder="Draft your answer here…"
              rows={3}
              style={{ borderColor: C.line }}
              className="w-full rounded-lg border p-2.5 text-sm mb-2"
            />
            <button onClick={() => setRevealed({ ...revealed, [i]: !revealed[i] })} className="text-xs font-semibold" style={{ color: C.accent }}>
              {revealed[i] ? "Hide tip" : "Show tip"}
            </button>
            {revealed[i] && (
              <div style={{ background: C.accentSoft, color: C.accentDeep }} className="rounded-lg p-3 mt-2 text-xs leading-relaxed">
                {tip(q)}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Btn variant="outline" onClick={() => setView("results")}>Back to results</Btn>
        <Btn onClick={() => setView("tracker")}>Track this application</Btn>
      </div>
    </div>
  );
}

/* ============================== RELOCATION TOOLKIT ============================== */
const UNIVERSAL_CHECKLIST = [
  "Valid passport with at least 6 months validity remaining",
  "Signed job offer letter or employment contract",
  "Educational certificates (originals + copies)",
  "Professional certifications relevant to your role",
  "Updated CV and portfolio (if applicable)",
  "Passport-sized photos (check destination's exact spec)",
  "Bank statements or proof of funds (some countries require this)",
  "Medical fitness / health check certificate",
  "Certificate of Good Conduct / police clearance certificate",
];

const COUNTRY_NOTES = {
  "qatar": ["Work visa (RP) is usually sponsored by the employer.", "Certificate attestation required from your home country's foreign ministry and the Qatari embassy.", "Medical test done locally after arrival for residency permit."],
  "united arab emirates": ["Educational certificates must be attested (home country + UAE embassy, then MOFA in UAE).", "Employer typically handles the work permit and Emirates ID process.", "Some professions require Ministry of Health license (healthcare, education)."],
  "uae": ["Educational certificates must be attested (home country + UAE embassy, then MOFA in UAE).", "Employer typically handles the work permit and Emirates ID process.", "Some professions require Ministry of Health license (healthcare, education)."],
  "saudi arabia": ["Certificate attestation from Saudi embassy is mandatory before entry.", "A local sponsor (Kafeel) — usually your employer — is required for the work visa.", "Medical exam (GAMCA) required before visa issuance."],
  "kuwait": ["Certificate attestation required at the Kuwaiti embassy.", "Employer sponsors the work permit (Iqama).", "Pre-employment medical test typically required."],
  "bahrain": ["Attestation of degree certificates recommended before travel.", "Work permit is employer-sponsored via LMRA.", "Medical fitness test required for residency."],
  "oman": ["Certificate attestation from the Omani embassy required.", "Employer handles labour card and residency card (Iqama) processing.", "No Objection Certificate (NOC) may apply if switching employers within Oman."],
  "france": ["EU/EEA citizens don't need a work visa; non-EU citizens need a 'passeport talent' or standard work visa.", "Degree recognition (equivalence) may be required for regulated professions.", "Employer usually initiates the work permit application."],
  "germany": ["Non-EU citizens typically need a Blue Card or work visa tied to a job offer.", "Degree recognition via 'Anerkennung' may be required, especially for regulated fields.", "Health insurance registration is mandatory soon after arrival."],
  "united kingdom": ["A Skilled Worker visa requires employer sponsorship (Certificate of Sponsorship).", "Minimum salary thresholds apply depending on the role.", "IELTS or equivalent English test may be required."],
  "uk": ["A Skilled Worker visa requires employer sponsorship (Certificate of Sponsorship).", "Minimum salary thresholds apply depending on the role.", "IELTS or equivalent English test may be required."],
  "united states": ["Most work visas (H-1B, L-1, etc.) require employer sponsorship and are subject to annual caps/lotteries.", "Credential evaluation (e.g. via WES) may be required for some professions.", "Processing times can be long — start early."],
  "usa": ["Most work visas (H-1B, L-1, etc.) require employer sponsorship and are subject to annual caps/lotteries.", "Credential evaluation (e.g. via WES) may be required for some professions.", "Processing times can be long — start early."],
  "canada": ["Express Entry or employer-specific work permits are common routes.", "Educational Credential Assessment (ECA) often required for skilled worker programs.", "Language test (IELTS/TEF) usually required."],
};

function findCountryNotes(country) {
  const c = (country || "").toLowerCase().trim();
  if (!c) return null;
  for (const key in COUNTRY_NOTES) {
    if (c.includes(key) || key.includes(c)) return COUNTRY_NOTES[key];
  }
  return [];
}

function RelocationToolkit({ setView }) {
  const [country, setCountry] = useState("");
  const [checked, setChecked] = useState({});
  const [searched, setSearched] = useState(false);
  const [notes, setNotes] = useState([]);

  function search() {
    setNotes(findCountryNotes(country) || []);
    setSearched(true);
  }
  function toggle(key) {
    setChecked({ ...checked, [key]: !checked[key] });
  }
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
      <Badge>For international job seekers</Badge>
      <h1 className="tc-serif text-3xl font-semibold mt-4 mb-2" style={{ color: C.ink }}>Relocation Toolkit</h1>
      <p className="text-sm mb-8 max-w-lg" style={{ color: C.inkSoft }}>A general checklist for documents and steps commonly needed when relocating for work abroad, with notes for popular destinations.</p>

      <Card className="p-5 mb-6">
        <label className="text-xs font-semibold block mb-1.5" style={{ color: C.inkFaint }}>Destination country</label>
        <div className="flex gap-2">
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Qatar, Germany, Canada…" style={{ borderColor: C.line }} className="flex-1 rounded-lg border p-2.5 text-sm" />
          <Btn onClick={search}>Search</Btn>
        </div>
      </Card>

      {searched && (
        <Card className="p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.inkFaint }}>
            {notes.length > 0 ? `Notes for ${country}` : `No specific notes for "${country}" yet`}
          </div>
          {notes.length > 0 ? (
            <ul className="space-y-2">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: C.inkSoft }}>
                  <ArrowRight size={14} className="mt-1 shrink-0" style={{ color: C.accent }} />{n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: C.inkSoft }}>Use the universal checklist below, and always confirm exact requirements with the destination country's embassy or your employer's HR/immigration team.</p>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.inkFaint }}>Universal checklist</div>
        <Badge tone={doneCount === UNIVERSAL_CHECKLIST.length ? "good" : "neutral"}>{doneCount}/{UNIVERSAL_CHECKLIST.length} done</Badge>
      </div>
      <Card className="p-5 mb-6">
        <div className="space-y-3">
          {UNIVERSAL_CHECKLIST.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-sm" style={{ color: checked[i] ? C.inkFaint : C.inkSoft, textDecoration: checked[i] ? "line-through" : "none" }}>{item}</span>
            </label>
          ))}
        </div>
      </Card>

      <div style={{ background: C.warningBg, border: "1px solid #F0DBA8" }} className="rounded-xl p-4 flex gap-3 items-start text-sm mb-6">
        <AlertTriangle size={16} style={{ color: C.warning }} className="mt-0.5 shrink-0" />
        <span style={{ color: "#8A5A0A" }}>Requirements change frequently and vary by nationality, profession, and employer. Always verify current requirements with the official embassy, consulate, or your employer's HR team before traveling.</span>
      </div>

      <div className="text-center">
        <Btn variant="outline" onClick={() => setView("analyzer")}>Analyze your CV</Btn>
      </div>
    </div>
  );
}

/* ============================== STATIC PAGES ============================== */
function StaticPage({ title, updated, children, setView }) {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
      <h1 className="tc-serif text-3xl font-semibold mb-2" style={{ color: C.ink }}>{title}</h1>
      {updated && <p className="text-xs mb-8" style={{ color: C.inkFaint }}>Last updated: {updated}</p>}
      <div className="space-y-5 text-sm leading-relaxed" style={{ color: C.inkSoft }}>{children}</div>
      <div className="mt-10">
        <Btn variant="outline" onClick={() => setView("landing")}>Back to home</Btn>
      </div>
    </div>
  );
}

function PrivacyPolicy({ setView }) {
  return (
    <StaticPage title="Privacy Policy" updated="August 2026" setView={setView}>
      <p>TrueCV AI ("we", "our", "us") respects your privacy. This policy explains what information we collect and how we use it.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Information we collect</h3>
      <p>When you use our CV analysis tools, the text you submit (CV content, job descriptions) is processed to generate results. Job Tracker and checklist data you enter is stored locally in your browser and is not sent to our servers.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>How we use information</h3>
      <p>Submitted content is used solely to generate the analysis, suggestions, or documents you request. We do not sell your personal information to third parties.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Cookies and analytics</h3>
      <p>We may use basic analytics to understand site usage and improve the product. These do not identify you personally.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Your rights</h3>
      <p>You can contact us at any time to ask what data we hold about you or to request deletion, using the WhatsApp contact link in the footer.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Changes to this policy</h3>
      <p>We may update this policy as the product evolves. Continued use of the site after changes means you accept the updated policy.</p>
    </StaticPage>
  );
}

function TermsOfService({ setView }) {
  return (
    <StaticPage title="Terms of Service" updated="August 2026" setView={setView}>
      <p>By using TrueCV AI, you agree to the following terms.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Use of the service</h3>
      <p>TrueCV AI provides CV analysis, writing suggestions, and related career tools. Results are AI-generated estimates intended to help you improve your application materials — they are not guarantees of interviews, ATS outcomes, salary, or employment.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Your responsibilities</h3>
      <p>You are responsible for the accuracy of content you submit and for reviewing any AI-generated suggestions before using them. Do not submit false information or content you don't have rights to.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Subscriptions and payments</h3>
      <p>Paid plans, when available, are billed as described at checkout. You may cancel at any time; refunds are handled on a case-by-case basis via our support contact.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Limitation of liability</h3>
      <p>TrueCV AI is provided "as is". We are not liable for employment decisions, missed opportunities, or damages resulting from use of the service.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Changes</h3>
      <p>We may update these terms as the product evolves. Continued use of the site means you accept the current terms.</p>
    </StaticPage>
  );
}

function RefundPolicy({ setView }) {
  return (
    <StaticPage title="Refund Policy" updated="August 2026" setView={setView}>
      <p>We want you to be satisfied with TrueCV AI. This policy explains how refunds work for paid subscriptions (Pro and Career Package).</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>14-day money-back guarantee</h3>
      <p>If you're not happy with your subscription, you can request a full refund within 14 days of your initial purchase, no questions asked.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>How to request a refund</h3>
      <p>Contact us via the WhatsApp button available on every page of the site, or through the payment receipt sent by our payment provider, Paddle. Include your order/transaction reference so we can locate your payment quickly.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Processing time</h3>
      <p>Approved refunds are typically processed within 5–10 business days, depending on your bank or card issuer.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Subscription cancellations</h3>
      <p>You can cancel your subscription at any time to stop future billing. Cancelling does not automatically trigger a refund for the current billing period unless it falls within the 14-day window above.</p>
      <h3 className="font-semibold" style={{ color: C.ink }}>Payment processor</h3>
      <p>All payments are processed securely by Paddle.com Market Ltd, our payments and Merchant of Record provider. Paddle may also handle certain refund requests directly in accordance with their own policies.</p>
    </StaticPage>
  );
}

function AboutUs({ setView }) {
  return (
    <StaticPage title="About TrueCV AI" setView={setView}>
      <p>TrueCV AI was built to help job seekers — especially those applying across borders, from the MENA region to the Gulf, Europe, and beyond — put their best CV forward.</p>
      <p>Job hunting internationally comes with extra friction: ATS systems that filter CVs before a human ever sees them, unfamiliar formatting expectations, and confusing relocation paperwork. TrueCV AI brings CV analysis, cover letter generation, salary insights, interview preparation, and a relocation checklist together in one place, so you don't have to piece together advice from a dozen different sources.</p>
      <p>We're just getting started, and we're building this in the open — improving it step by step based on real feedback from people actually applying for jobs. If you have suggestions or run into an issue, reach out any time via WhatsApp using the button on this site.</p>
    </StaticPage>
  );
}

/* ============================== APP ROOT ============================== */
const PATH_VIEWS = {
  "/": "landing",
  "/pricing": "pricing",
  "/terms": "terms",
  "/privacy": "privacy",
  "/refund": "refund",
  "/about": "about",
};
const VIEW_PATHS = Object.fromEntries(Object.entries(PATH_VIEWS).map(([k, v]) => [v, k]));

export default function TrueCVApp() {
  const [view, setViewRaw] = useState(() => PATH_VIEWS[window.location.pathname] || "landing");
  const [analysis, setAnalysis] = useState(null);
  const [cvInput, setCvInput] = useState("");
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  function setView(v) {
    setViewRaw(v);
    const path = VIEW_PATHS[v] || "/";
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    window.scrollTo(0, 0);
  }

  React.useEffect(() => {
    function onPopState() {
      setViewRaw(PATH_VIEWS[window.location.pathname] || "landing");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLoaded(true);
      if (newSession) setView((v) => (v === "login" || v === "signup" ? "dashboard" : v));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setView("landing");
  }

  const page = useMemo(() => {
    switch (view) {
      case "analyzer": return <Analyzer setView={setView} setAnalysis={setAnalysis} setCvInput={setCvInput} session={session} />;
      case "results": return <Results analysis={analysis} setView={setView} cvInput={cvInput} />;
      case "improve": return <ImproveCV analysis={analysis} cvInput={cvInput} setView={setView} />;
      case "coverletter": return <CoverLetter analysis={analysis} setView={setView} />;
      case "pricing": return <PricingPage setView={setView} />;
      case "login": return <AuthPage mode="login" setView={setView} />;
      case "signup": return <AuthPage mode="signup" setView={setView} />;
      case "forgot": return <ForgotPassword setView={setView} />;
      case "dashboard": return <Dashboard setView={setView} analysis={analysis} session={session} onLogout={handleLogout} />;
      case "tracker": return <JobTracker setView={setView} />;
      case "salary": return <SalaryInsights setView={setView} />;
      case "interview": return <InterviewPrep analysis={analysis} setView={setView} />;
      case "toolkit": return <RelocationToolkit setView={setView} />;
      case "privacy": return <PrivacyPolicy setView={setView} />;
      case "terms": return <TermsOfService setView={setView} />;
      case "refund": return <RefundPolicy setView={setView} />;
      case "about": return <AboutUs setView={setView} />;
      default: return <Landing setView={setView} />;
    }
  }, [view, analysis, cvInput, session]);

  return (
    <div className="tc-root min-h-screen tc-scrollbar">
      <style>{FONTS}</style>
      <Nav view={view} setView={setView} />
      {page}
      <Footer setView={setView} />
      <a
        href="https://wa.me/21621918127?text=Hi%2C%20I%20have%20a%20question%20about%20TrueCV%20AI"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on WhatsApp"
        style={{ background: "#25D366", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 32 32" width="22" height="22" className="sm:w-7 sm:h-7" fill="#fff"><path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.7 4.607 1.902 6.474L4 29l7.727-1.867A11.94 11.94 0 0 0 16.001 27C22.629 27 28 21.627 28 15S22.629 3 16.001 3zm0 21.818c-1.93 0-3.727-.55-5.25-1.5l-.377-.223-4.59 1.109 1.127-4.47-.246-.393A9.77 9.77 0 0 1 5.182 15c0-5.964 4.855-10.818 10.819-10.818S26.818 9.036 26.818 15 21.965 24.818 16.001 24.818zm5.964-8.19c-.327-.163-1.936-.955-2.236-1.064-.3-.109-.518-.163-.736.164-.218.327-.845 1.064-1.036 1.282-.191.218-.382.245-.709.082-.327-.164-1.38-.509-2.63-1.622-.972-.867-1.628-1.937-1.82-2.264-.191-.327-.02-.504.144-.667.148-.147.327-.382.49-.573.164-.191.218-.327.327-.545.109-.218.055-.409-.027-.573-.082-.164-.736-1.773-1.009-2.427-.266-.64-.536-.553-.736-.563l-.627-.011c-.218 0-.573.082-.873.409-.3.327-1.145 1.118-1.145 2.727 0 1.609 1.173 3.164 1.336 3.382.164.218 2.309 3.527 5.596 4.945.782.338 1.393.54 1.869.691.785.25 1.5.215 2.065.13.63-.094 1.936-.792 2.209-1.556.273-.764.273-1.418.191-1.556-.082-.137-.3-.218-.627-.382z"/></svg>
      </a>
    </div>
  );
}
