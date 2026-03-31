import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-black text-white">
            A
          </div>
          <span className="text-lg font-bold text-gray-900">AgentRFP</span>
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Home
        </Link>
      </nav>

      <article className="max-w-4xl mx-auto px-6 md:px-16 py-12 prose prose-gray">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 31, 2026</p>

        <p className="text-gray-700 leading-relaxed">
          This Privacy Policy describes how <strong>Capacaro LLC</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
          collects, uses, and protects your information when you use the AgentRFP platform (&quot;Service&quot;).
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>

        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Account Information</h3>
        <p className="text-gray-700 leading-relaxed">
          When you register, we collect your name, email address, and organization name. If you sign in
          via SSO (Google, Microsoft, Okta), we receive your name and email from the identity provider.
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Content You Upload</h3>
        <p className="text-gray-700 leading-relaxed">
          This includes RFP documents, knowledge base files, and any text you enter into the Service.
          This content is stored in your organization&apos;s isolated database and storage environment.
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">API Keys</h3>
        <p className="text-gray-700 leading-relaxed">
          When you provide API keys for AI providers (Anthropic, OpenAI, Google), they are encrypted
          at rest and used solely to make API calls on your behalf. We never log, share, or access
          your keys for any other purpose.
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Usage Data</h3>
        <p className="text-gray-700 leading-relaxed">
          We collect basic usage data including login timestamps, feature usage patterns, and error logs.
          This data is used solely to maintain and improve the Service.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
        <ul className="text-gray-700 space-y-1 mt-2">
          <li>To provide and maintain the Service</li>
          <li>To authenticate your identity and manage your account</li>
          <li>To process your content through AI providers as you direct</li>
          <li>To send service-related communications (account alerts, security notices)</li>
          <li>To improve the Service based on aggregated, anonymized usage patterns</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          <strong>We do NOT:</strong>
        </p>
        <ul className="text-gray-700 space-y-1 mt-2">
          <li>Use your content to train AI models</li>
          <li>Share your content with other customers</li>
          <li>Sell your personal information to third parties</li>
          <li>Access your content except as needed to provide the Service</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. AI Provider Data Handling</h2>
        <p className="text-gray-700 leading-relaxed">
          When you use AI features, your content is sent to the AI provider associated with your API key:
        </p>
        <ul className="text-gray-700 space-y-2 mt-2">
          <li>
            <strong>Anthropic (Claude):</strong> Commercial API terms include zero data retention (ZDR).
            Your data is not stored by Anthropic and is not used for model training.
          </li>
          <li>
            <strong>OpenAI (GPT):</strong> API data is not used for training by default on paid tiers.
            Review OpenAI&apos;s data usage policies for your specific plan.
          </li>
          <li>
            <strong>Google (Gemini):</strong> Paid API usage is covered by Google Cloud&apos;s data processing
            terms. Review Google&apos;s AI data governance for your specific agreement.
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          We recommend reviewing your AI provider&apos;s data processing terms to ensure they meet
          your organization&apos;s requirements.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Data Storage &amp; Security</h2>
        <ul className="text-gray-700 space-y-1 mt-2">
          <li><strong>Infrastructure:</strong> Hosted on Vercel (SOC 2 Type II) and Supabase (SOC 2 Type II)</li>
          <li><strong>Database:</strong> PostgreSQL with Row Level Security (RLS) enforcing organization-level isolation</li>
          <li><strong>Encryption:</strong> TLS 1.2+ in transit, AES-256 at rest</li>
          <li><strong>API Keys:</strong> Encrypted at rest, never logged or exposed client-side</li>
          <li><strong>File Storage:</strong> Isolated per organization in Supabase Storage with access policies</li>
          <li><strong>Audit Trail:</strong> All significant actions are logged with user, timestamp, and details</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Data Retention</h2>
        <p className="text-gray-700 leading-relaxed">
          Your data is retained for as long as your account is active. Upon account deletion or
          termination, we will delete all your data (including uploaded files, RFP content, answers,
          and knowledge base materials) within 30 days. Audit logs may be retained for up to 90 days
          for security purposes.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 leading-relaxed">
          We use the following third-party services to operate the platform:
        </p>
        <ul className="text-gray-700 space-y-1 mt-2">
          <li><strong>Supabase:</strong> Database, authentication, and file storage</li>
          <li><strong>Vercel:</strong> Application hosting and deployment</li>
          <li><strong>AI Providers:</strong> Anthropic, OpenAI, Google (as selected by you via BYOK)</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          Each third-party service has its own privacy policy. We select providers that maintain
          industry-standard security certifications.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Your Rights</h2>
        <p className="text-gray-700 leading-relaxed">
          Depending on your jurisdiction, you may have the following rights:
        </p>
        <ul className="text-gray-700 space-y-1 mt-2">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data and account</li>
          <li><strong>Export:</strong> Request an export of your data in a portable format</li>
          <li><strong>Objection:</strong> Object to processing of your personal data</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          To exercise any of these rights, contact us at info@agentrfp.ai.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Cookies</h2>
        <p className="text-gray-700 leading-relaxed">
          We use essential cookies for authentication and session management. We do not use tracking
          cookies, advertising cookies, or third-party analytics cookies. Session cookies are
          httpOnly and secure.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Children&apos;s Privacy</h2>
        <p className="text-gray-700 leading-relaxed">
          The Service is not directed to individuals under 18 years of age. We do not knowingly
          collect personal information from children.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. International Data Transfers</h2>
        <p className="text-gray-700 leading-relaxed">
          Your data may be processed in the United States where our infrastructure providers operate.
          By using the Service, you consent to the transfer of your data to the United States.
          We ensure appropriate safeguards are in place for international transfers.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">11. Changes to This Policy</h2>
        <p className="text-gray-700 leading-relaxed">
          We may update this Privacy Policy from time to time. We will notify you of material changes
          via email or in-app notification at least 30 days before they take effect. The &quot;Last updated&quot;
          date at the top indicates the most recent revision.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">12. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          For questions about this Privacy Policy or to exercise your data rights, contact us at:
          <br />
          <strong>Capacaro LLC</strong>
          <br />
          Email: info@agentrfp.ai
        </p>
      </article>
    </div>
  );
}
