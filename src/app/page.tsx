import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-black">
            A
          </div>
          <span className="text-lg font-bold tracking-tight">AgentRFP</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-white text-[#0a0f1c] px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-blue-300 font-medium tracking-wide uppercase">
              75% cheaper than Loopio &amp; Responsive
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6">
            Answer RFPs
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400">
              in minutes,
            </span>
            <br />
            not weeks.
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
            AI-powered RFP response platform that drafts answers from your
            approved knowledge base. Upload, parse, generate, review, export.
            Your team&apos;s RFP workflow, supercharged.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 rounded-xl font-semibold text-base hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Start Free
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-gray-700 px-8 py-4 rounded-xl font-semibold text-base text-gray-300 hover:border-gray-500 hover:text-white transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Floating stats */}
        <div className="absolute right-16 top-32 hidden lg:block space-y-4">
          <StatCard number="10x" label="faster first draft" />
          <StatCard number="$49" label="per user/month" />
          <StatCard number="3" label="AI providers" />
        </div>
      </section>

      {/* Social proof bar */}
      <section className="relative z-10 border-y border-gray-800 bg-[#0d1220]">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">
            Built for teams using
          </p>
          {["ServiceNow", "Coupa", "SAP Ariba", "Slack", "Teams", "Salesforce"].map(
            (name) => (
              <span
                key={name}
                className="text-sm font-semibold text-gray-500 hover:text-gray-300 transition-colors"
              >
                {name}
              </span>
            )
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-24">
        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
          Five steps. Zero busywork.
        </h2>
        <p className="text-gray-500 mb-16 max-w-lg">
          From upload to export-ready response in minutes, not weeks.
        </p>
        <div className="grid md:grid-cols-5 gap-6">
          {[
            { step: "01", title: "Upload", desc: "Drop your knowledge docs \u2014 PDFs, DOCX, Excel, CSV" },
            { step: "02", title: "Import", desc: "Upload the RFP. AI parses every question per section." },
            { step: "03", title: "Generate", desc: "AI drafts answers from your knowledge base instantly." },
            { step: "04", title: "Review", desc: "Edit, assign sections, approve. Full version history." },
            { step: "05", title: "Export", desc: "Download polished Word or Excel. Push to ServiceNow." },
          ].map((item) => (
            <div key={item.step} className="group">
              <div className="text-5xl font-black text-gray-800 group-hover:text-blue-500/30 transition-colors mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-24">
        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
          Everything you need.
          <br />
          <span className="text-gray-600">Nothing you don&apos;t.</span>
        </h2>
        <p className="text-gray-500 mb-16 max-w-lg">
          Built for proposal teams, sales engineers, and security teams who
          answer RFPs, RFIs, and vendor questionnaires.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<AIIcon />}
            title="AI Answer Generation"
            desc="Drafts professional answers from your knowledge base. No citations in output \u2014 clean and customer-ready."
            accent="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon={<ProvidersIcon />}
            title="Multi-Provider AI"
            desc="Choose Claude, GPT-4o, or Gemini. Switch anytime. BYOK \u2014 you control costs and data."
            accent="from-violet-500 to-purple-500"
          />
          <FeatureCard
            icon={<KBIcon />}
            title="Knowledge Base"
            desc="Upload PDFs, DOCX, Excel, CSV. Auto-chunked and searchable. Smarter with every RFP."
            accent="from-emerald-500 to-teal-500"
          />
          <FeatureCard
            icon={<LibraryIcon />}
            title="Answer Library"
            desc="Approved answers auto-categorized into 24 standard sections. Reused instantly on future RFPs."
            accent="from-amber-500 to-orange-500"
          />
          <FeatureCard
            icon={<SectionsIcon />}
            title="Section Workflow"
            desc="Process large questionnaires sheet-by-sheet. Filter, generate, and approve per section."
            accent="from-rose-500 to-pink-500"
          />
          <FeatureCard
            icon={<TeamIcon />}
            title="Team Collaboration"
            desc="Assign sections to teammates. Slack and Teams notifications. Role-based access."
            accent="from-sky-500 to-blue-500"
          />
          <FeatureCard
            icon={<ResponseIcon />}
            title="Smart Response Detection"
            desc="Detects Yes/No, dropdowns, and structured formats in Excel RFPs. Click to respond."
            accent="from-lime-500 to-green-500"
          />
          <FeatureCard
            icon={<ExportIcon />}
            title="Word &amp; Excel Export"
            desc="Clean exports with no AI metadata. Response + Comment columns. Download from list or detail."
            accent="from-indigo-500 to-violet-500"
          />
          <FeatureCard
            icon={<ConnectorIcon />}
            title="Enterprise Connectors"
            desc="ServiceNow VRM, Coupa, SAP Ariba. Import questionnaires and push responses back."
            accent="from-cyan-500 to-teal-500"
          />
          <FeatureCard
            icon={<SSOIcon />}
            title="SSO &amp; Auth"
            desc="Google, Microsoft, Okta. Email invites. Domain auto-join. Enterprise-ready from day one."
            accent="from-fuchsia-500 to-pink-500"
          />
          <FeatureCard
            icon={<VersionIcon />}
            title="Version History"
            desc="Every edit tracked. Compare and restore any version. Full audit trail for compliance."
            accent="from-orange-500 to-red-500"
          />
          <FeatureCard
            icon={<ShieldIcon />}
            title="Security &amp; ZDR"
            desc="Zero data retention with AI providers. Encrypted keys. Row-level security. SOC 2 infra."
            accent="from-gray-500 to-gray-400"
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-24">
        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-center">
          75% less than the competition.
        </h2>
        <p className="text-gray-500 mb-16 text-center max-w-lg mx-auto">
          Same features. Better AI. Fraction of the price. BYOK means you
          control your AI costs directly.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Competitors */}
          <div className="rounded-2xl border border-gray-800 bg-[#0d1220] p-8">
            <p className="text-sm text-gray-500 font-medium mb-2">Loopio</p>
            <p className="text-3xl font-black text-gray-600">$200+</p>
            <p className="text-sm text-gray-600 mb-6">per user/month</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Long implementation</li>
              <li>Annual contracts only</li>
              <li>Enterprise sales process</li>
            </ul>
          </div>

          {/* AgentRFP */}
          <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-b from-blue-500/10 to-transparent p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-xs font-bold px-4 py-1 rounded-full">
              RECOMMENDED
            </div>
            <p className="text-sm text-blue-300 font-medium mb-2">AgentRFP</p>
            <p className="text-3xl font-black text-white">$49</p>
            <p className="text-sm text-gray-400 mb-6">per user/month</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Start in 5 minutes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> BYOK \u2014 control AI costs
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> All features included
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Cancel anytime
              </li>
            </ul>
            <Link
              href="/signup"
              className="block text-center mt-8 bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Get Started Free
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#0d1220] p-8">
            <p className="text-sm text-gray-500 font-medium mb-2">Responsive</p>
            <p className="text-3xl font-black text-gray-600">$150+</p>
            <p className="text-sm text-gray-600 mb-6">per user/month</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Complex onboarding</li>
              <li>Per-seat minimums</li>
              <li>Limited AI features</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-24">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-12 md:p-20 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Ready to win more deals?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-md mx-auto">
            Set up in 5 minutes. No credit card required.
            Upload your first RFP today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-100 transition-colors"
          >
            Get Started Free
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-black">
                  A
                </div>
                <span className="font-bold">AgentRFP</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI-powered RFP response platform.
                <br />
                Built for teams that win.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-400">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/signup" className="hover:text-gray-300">Get Started</Link></li>
                <li><Link href="/login" className="hover:text-gray-300">Sign In</Link></li>
                <li><Link href="/help" className="hover:text-gray-300">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-400">Integrations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>ServiceNow VRM</li>
                <li>Coupa Procurement</li>
                <li>SAP Ariba</li>
                <li>Slack &amp; Teams</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-gray-400">Security</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Zero Data Retention</li>
                <li>SOC 2 Infrastructure</li>
                <li>Row-Level Security</li>
                <li>Encrypted at Rest</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-gray-600 text-center">
            <div className="flex items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} Capacaro LLC. All rights reserved.</span>
          <Link href="/terms" className="hover:text-gray-400">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-400">Privacy</Link>
        </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* --- Components --- */

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-[#0d1220] border border-gray-800 rounded-xl px-5 py-4 backdrop-blur-sm">
      <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
        {number}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-800 bg-[#0d1220] p-6 hover:border-gray-700 transition-all">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-base mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* --- Icons (inline SVGs) --- */
function AIIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}
function ProvidersIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}
function KBIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
    </svg>
  );
}
function LibraryIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function SectionsIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}
function ResponseIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
function ConnectorIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}
function SSOIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}
function VersionIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
