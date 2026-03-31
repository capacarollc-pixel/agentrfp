import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 31, 2026</p>

        <p className="text-gray-700 leading-relaxed">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the AgentRFP platform
          (&quot;Service&quot;), operated by <strong>Capacaro LLC</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
          By accessing or using the Service, you agree to be bound by these Terms.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Account Registration</h2>
        <p className="text-gray-700 leading-relaxed">
          You must provide accurate information when creating an account. You are responsible for maintaining
          the security of your account credentials. You must be at least 18 years old and have the authority
          to bind your organization to these Terms. One person may not maintain more than one account.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Use of Service</h2>
        <p className="text-gray-700 leading-relaxed">
          The Service provides AI-assisted RFP response capabilities. You may use the Service for lawful
          business purposes only. You are responsible for all content you upload, generate, or export
          through the Service. You agree not to:
        </p>
        <ul className="text-gray-700 space-y-1 mt-2">
          <li>Use the Service for any illegal or unauthorized purpose</li>
          <li>Attempt to gain unauthorized access to other accounts or systems</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Use the Service to generate misleading, fraudulent, or harmful content</li>
          <li>Exceed reasonable usage limits or abuse API rate limits</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. AI-Generated Content</h2>
        <p className="text-gray-700 leading-relaxed">
          The Service uses third-party AI models (Anthropic Claude, OpenAI GPT, Google Gemini) to generate
          draft responses. AI-generated content is provided as a starting point and should be reviewed by
          qualified humans before submission to customers or partners. We do not guarantee the accuracy,
          completeness, or suitability of AI-generated content. You are solely responsible for reviewing
          and approving all content before use.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Your API Keys (BYOK)</h2>
        <p className="text-gray-700 leading-relaxed">
          The Service operates on a Bring Your Own Key (BYOK) model. You provide your own API keys for
          AI providers. Your API usage and costs with those providers are governed by your agreements with
          them, not by us. We encrypt your keys at rest and use them only to make API calls on your behalf.
          We never share your keys with third parties.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Your Data</h2>
        <p className="text-gray-700 leading-relaxed">
          You retain all ownership rights to your data, including uploaded documents, RFP content, generated
          answers, and knowledge base materials. We do not claim any ownership of your content. We access
          your data only to provide the Service and will not use it for any other purpose, including training
          AI models. Upon account deletion, we will delete all your data within 30 days.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Data Isolation</h2>
        <p className="text-gray-700 leading-relaxed">
          Each organization&apos;s data is isolated at the database level using Row Level Security (RLS).
          Your data is never accessible to other organizations using the Service. All data is encrypted
          in transit (TLS 1.2+) and at rest.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Pricing &amp; Payment</h2>
        <p className="text-gray-700 leading-relaxed">
          The Service is offered at $49 per user per month. We reserve the right to modify pricing with
          30 days notice. During the design partner phase, pricing may be adjusted or waived. AI provider
          costs (Anthropic, OpenAI, Google) are billed directly by those providers and are not included
          in our pricing.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Service Availability</h2>
        <p className="text-gray-700 leading-relaxed">
          We strive for high availability but do not guarantee uninterrupted access. We may perform
          maintenance with reasonable notice. We are not liable for service interruptions caused by
          third-party providers (Supabase, Vercel, AI providers).
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Limitation of Liability</h2>
        <p className="text-gray-700 leading-relaxed">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAPACARO LLC SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA,
          OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL
          NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Indemnification</h2>
        <p className="text-gray-700 leading-relaxed">
          You agree to indemnify and hold harmless Capacaro LLC from any claims, damages, or expenses
          arising from your use of the Service, your content, or your violation of these Terms.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">11. Termination</h2>
        <p className="text-gray-700 leading-relaxed">
          Either party may terminate at any time. You may delete your account through the Service or by
          contacting us. We may suspend or terminate accounts that violate these Terms. Upon termination,
          your right to use the Service ceases and we will delete your data within 30 days.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">12. Governing Law</h2>
        <p className="text-gray-700 leading-relaxed">
          These Terms are governed by the laws of the State of New Jersey, United States, without regard
          to conflict of law principles. Any disputes shall be resolved in the state or federal courts
          located in New Jersey.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">13. Changes to Terms</h2>
        <p className="text-gray-700 leading-relaxed">
          We may update these Terms from time to time. We will notify you of material changes via email
          or in-app notification at least 30 days before they take effect. Continued use of the Service
          after changes constitutes acceptance.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">14. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          For questions about these Terms, contact us at:
          <br />
          <strong>Capacaro LLC</strong>
          <br />
          Email: info@agentrfp.ai
        </p>
      </article>
    </div>
  );
}
