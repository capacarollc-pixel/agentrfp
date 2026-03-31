export const dynamic = "force-dynamic";

export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Help &amp; Documentation</h1>
      <p className="text-gray-500 mb-4">Everything you need to get started with AgentRFP.</p>

      {/* Quick links */}
      <nav className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Jump to</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
          {[
            { id: "quick-start", label: "Quick Start" },
            { id: "knowledge-base", label: "Knowledge Base" },
            { id: "rfp-import", label: "RFP Import & Parsing" },
            { id: "sections", label: "Section Workflow" },
            { id: "ai-generation", label: "AI Answer Generation" },
            { id: "multi-provider", label: "Multi-Provider AI" },
            { id: "structured-responses", label: "Structured Responses" },
            { id: "review-approval", label: "Review & Approval" },
            { id: "versioning", label: "Answer Versioning" },
            { id: "answer-library", label: "Answer Library" },
            { id: "assignment", label: "Assignment" },
            { id: "traceability", label: "AI Traceability" },
            { id: "export", label: "Export" },
            { id: "team", label: "Team & Collaboration" },
            { id: "sso", label: "SSO" },
            { id: "integrations", label: "Integrations" },
            { id: "search", label: "Search" },
            { id: "deleting", label: "Deleting Items" },
            { id: "api-keys", label: "API Keys (BYOK)" },
            { id: "security", label: "Security & Privacy" },
            { id: "salesforce", label: "Salesforce (Soon)" },
          ].map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline py-0.5"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Quick Start */}
      <section id="quick-start" className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-8 scroll-mt-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Start</h2>
        <ol className="space-y-3 text-sm text-blue-800">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            <div><strong>Add your AI provider key</strong> &mdash; Go to Settings &rarr; API Keys. Add a key for Anthropic (Claude), OpenAI (GPT-4o), or Google (Gemini).</div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            <div><strong>Upload knowledge docs</strong> &mdash; Go to Knowledge Base &rarr; Upload. Add your product sheets, past proposals, datasheets, and FAQs. Supported: PDF, DOCX, Excel, CSV, TXT.</div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
            <div><strong>Import an RFP</strong> &mdash; Go to RFPs &rarr; Import RFP. Upload the RFP document and click Parse Questions. AI will extract every question automatically.</div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
            <div><strong>Generate &amp; review answers</strong> &mdash; AI drafts answers using your knowledge base. Review, edit, assign to teammates, and approve each one.</div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">5</span>
            <div><strong>Export</strong> &mdash; Download your completed RFP response as Word or Excel. Approved answers are clean and professional with no AI metadata.</div>
          </li>
        </ol>
      </section>

      {/* Feature Guides */}
      <div className="space-y-6">

        <Guide
          id="knowledge-base"
          title="Knowledge Base"
          content={[
            "Upload any document that contains information about your company, products, or services.",
            "Supported formats: PDF, DOCX, Excel (.xlsx/.xls), CSV, TXT, and Markdown.",
            "Documents are automatically split into searchable chunks. The more documents you add, the better your AI answers will be.",
            "Use the search bar to find specific content across all uploaded documents.",
            "Click search results to view the full content inline.",
            "Delete documents you no longer need (two-step confirmation required).",
            "Tip: Upload past winning RFP responses &mdash; the AI will learn your company's voice and reuse proven answers.",
          ]}
        />

        <Guide
          id="rfp-import"
          title="RFP Import &amp; Question Parsing"
          content={[
            "Upload an RFP document (PDF, DOCX, or Excel) and AI will extract every question that needs a response.",
            "For Excel files with multiple tabs/sheets, each sheet is processed independently for better accuracy. The sheet name becomes the section label.",
            "Large RFPs are processed in the background &mdash; you'll see a progress indicator ('Parsed 147 questions so far...') that updates automatically.",
            "You can close the browser and come back &mdash; processing continues on the server.",
            "Questions are organized by section and numbered automatically.",
            "After parsing, AI automatically starts generating draft answers in the background.",
            "For Excel RFPs with response columns (Yes/No, dropdowns), the tool detects the response format and shows appropriate input buttons.",
          ]}
        />

        <Guide
          id="sections"
          title="Section-Based Workflow"
          content={[
            "Parsed questions are grouped by section (from sheet names or document headings).",
            "Use the section filter pills at the top to focus on one section at a time.",
            "Each pill shows progress: 'Access Control (8/20)' means 8 of 20 questions answered.",
            "A checkmark appears when all questions in a section are answered.",
            "Click 'Generate Answers' on a specific section to generate only for that section &mdash; much faster than generating everything at once.",
            "Sections follow standard RFP/security questionnaire categories: Business Info, Compliance, Access Control, Network Security, Privacy, etc.",
          ]}
        />

        <Guide
          id="ai-generation"
          title="AI Answer Generation"
          content={[
            "AI drafts answers using your uploaded knowledge base &mdash; it won't cite sources or mention the knowledge base in the response.",
            "For each question, the AI finds the most relevant chunks from your knowledge base and uses them as context.",
            "If you've approved a similar answer before, the Answer Library is checked first &mdash; reusing proven answers instantly without an AI call.",
            "The library matching uses smart similarity: 'penetration testing' matches 'pen test', 'organization' matches 'company', etc.",
            "Answers are saved incrementally &mdash; if you generate for 200 questions and walk away, each answer is saved as it's completed.",
            "Confidence scoring: High (strong knowledge base match), Low (partial coverage, flagged for review), None (no relevant knowledge found).",
            "Responses are clean and professional &mdash; no citation markers, no AI metadata. Ready to submit to a customer.",
          ]}
        />

        <Guide
          id="multi-provider"
          title="Multi-Provider AI Support"
          content={[
            "AgentRFP supports three AI providers. Add any key in Settings &rarr; API Keys:",
            "<strong>Anthropic (Claude)</strong> &mdash; Haiku (fast/cheap) for answer generation, Sonnet (quality) for question parsing. Best instruction following.",
            "<strong>OpenAI (GPT-4o)</strong> &mdash; GPT-4o-mini (fast) and GPT-4o (quality). Most popular models.",
            "<strong>Google (Gemini)</strong> &mdash; Gemini Flash (fast, 1M token context) and Pro (quality). Best for very large RFPs.",
            "The most recently added key is the active provider. Switch providers by adding a new key.",
            "Question parsing always uses the quality model. Answer generation uses the fast model to minimize cost.",
            "All providers include retry logic for rate limits.",
          ]}
        />

        <Guide
          id="structured-responses"
          title="Structured Responses (Yes/No/Dropdowns)"
          content={[
            "For Excel-based RFPs and security questionnaires, the AI detects when questions expect structured responses (Yes/No, Yes/No/N/A, or custom dropdown options).",
            "Detected response types show as clickable buttons: green for Yes, red for No, gray for N/A.",
            "The structured response (Yes/No) is separate from the detailed answer/comment.",
            "Both are exported: the Excel export includes a 'Response' column alongside the 'Answer/Comment' column.",
            "You can set the response value independently of the AI-generated comment.",
          ]}
        />

        <Guide
          id="review-approval"
          title="Review &amp; Approval Workflow"
          content={[
            "Each answer can be: Edited (click Edit), Regenerated (click Regenerate for a fresh AI draft), Approved (click Approve), or Flagged for review (click Needs Review).",
            "Approved answers are automatically saved to your Answer Library for reuse on future RFPs.",
            "Use 'Approve All' to bulk-approve all answers at once &mdash; marks the RFP as completed.",
            "Approved answers show clean &mdash; no 'AI Draft' label, no confidence badge. Just the answer.",
            "By default, export is blocked until all answers are approved (compliance setting).",
            "Approval tracking: each approved answer records who approved it and when.",
          ]}
        />

        <Guide
          id="versioning"
          title="Answer Versioning"
          content={[
            "Every edit to an answer saves the previous version automatically.",
            "Version number shown on the answer card (v1, v2, v3...).",
            "Click 'History' to view all previous versions with who edited and when.",
            "Click 'Restore' on any previous version to make it the current answer (the current version is preserved in history first).",
            "Approved answers lock editing &mdash; you must unapprove first if you need to change them.",
          ]}
        />

        <Guide
          id="answer-library"
          title="Answer Library"
          content={[
            "The Answer Library stores every approved Q&amp;A pair, cleaned of RFP-specific references (no citation markers, no section numbers).",
            "When generating answers for a new RFP, the library is checked first &mdash; matching questions reuse the approved answer instantly.",
            "Answers are auto-categorized into standard sections: Access Control, Network Security, Compliance, Privacy, etc.",
            "Use the filter pills to browse by category. Search to find specific Q&amp;A pairs.",
            "Library answers are versioned &mdash; each time you approve an updated answer to the same question, the version increments.",
            "Delete library entries you no longer want (two-step confirmation).",
            "Click search results to view the full answer inline.",
          ]}
        />

        <Guide
          id="assignment"
          title="Question &amp; Section Assignment"
          content={[
            "<strong>Assign a section:</strong> Click a section tab, then click 'Assign Section'. Select a team member and click 'Assign &amp; Notify'.",
            "<strong>Assign individual questions:</strong> Use the dropdown on each question card to assign to a specific person.",
            "The section pill shows the assignee's name: 'Access Control (12/20) &middot; Mike'.",
            "When you assign a section or question, a notification is sent to all configured integrations (Slack, Teams, webhook) with the assignee's name, the section/question, and a link to the RFP.",
            "Reassign at any time by changing the dropdown or re-assigning the section.",
          ]}
        />

        <Guide
          id="traceability"
          title="AI Traceability"
          content={[
            "Every AI-generated answer tracks which knowledge base chunks were used to write it.",
            "Click the 'Sources' button on any AI-drafted answer to see exactly what information the AI referenced.",
            "Sources are ranked by relevance &mdash; the top source had the most influence on the answer.",
            "Knowledge retrieval is per-question: a question about encryption gets encryption-related chunks, not random ones.",
            "This creates a full audit trail: you can verify every answer back to its source document.",
            "Manually edited or library-reused answers don't have AI sources (they didn't use the AI).",
          ]}
        />

        <Guide
          id="export"
          title="Export"
          content={[
            "Export to Word (.docx): Generates a formatted document with all questions and answers, organized by section.",
            "Export to Excel (.xlsx): Generates a spreadsheet with columns for #, Section, Question, Response (if applicable), and Answer/Comment.",
            "Exports are clean &mdash; no AI metadata, no confidence scores, no 'AI generated' labels.",
            "Download directly from the RFP list page (.docx and .xlsx buttons) or from the RFP detail page.",
            "If 'Require approval for export' is enabled (default), all answers must be approved before export is allowed.",
            "Delete RFPs you no longer need (two-step confirmation, also removes the source file).",
          ]}
        />

        <Guide
          id="team"
          title="Team &amp; Collaboration"
          content={[
            "<strong>How multiple users join the same org:</strong> There are three ways teammates can join your organization and share the same dashboard, RFPs, and knowledge base.",
            "<strong>1. Invite (primary method):</strong> Go to Settings &rarr; Team &rarr; enter their email &rarr; Send Invite. When they sign up (email/password or SSO), they auto-join your org with the role you selected.",
            "<strong>2. Domain auto-join:</strong> Set an allowed email domain on your org (e.g., acme.com). Anyone who signs up with an @acme.com email automatically joins your org &mdash; no invite needed.",
            "<strong>3. SSO auto-join:</strong> If a user has a pending invite and signs in via Google, Microsoft, or Okta, they auto-join your org.",
            "<strong>What everyone in an org shares:</strong> All RFPs, questions, answers, knowledge base documents, answer library, API keys, and integrations.",
            "<strong>What's separate per user:</strong> Their own login credentials, question assignments, and personal activity in the audit trail.",
            "<strong>Data isolation:</strong> Users in one org can never see another org's data. This is enforced at the database level (Row Level Security), not just in application code.",
            "Roles: Admins can manage API keys, invites, integrations, connectors, and settings. Members can work on RFPs and knowledge base.",
            "Pending invites are shown in the Team settings page. Admins can see who has been invited and when.",
          ]}
        />

        <Guide
          id="sso"
          title="SSO (Single Sign-On)"
          content={[
            "Google: Click 'Continue with Google' on the login page.",
            "Microsoft: Click 'Continue with Microsoft' for Azure AD authentication.",
            "Okta: Click 'Continue with Okta'. Requires Okta admin to create an OIDC app integration.",
            "To enable Google/Microsoft SSO: Go to Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Enable the provider and add OAuth credentials.",
            "To enable Okta: In Okta Admin Console &rarr; Applications &rarr; Create App Integration &rarr; OIDC Web App. Set redirect URI to your Supabase callback URL. Configure OIDC provider in Supabase with Client ID, Secret, and Issuer URL.",
            "Email/password login always works regardless of SSO configuration.",
          ]}
        />

        <Guide
          id="integrations"
          title="Integrations"
          content={[
            "<strong>Slack:</strong> Get an incoming webhook URL from api.slack.com/apps &rarr; Create App &rarr; Incoming Webhooks &rarr; Add to channel. Paste URL in Settings &rarr; Integrations.",
            "<strong>Microsoft Teams:</strong> In your Teams channel &rarr; Connectors &rarr; Incoming Webhook &rarr; Create. Copy URL and add in Settings &rarr; Integrations.",
            "<strong>Custom Webhook:</strong> Send events to any URL &mdash; works with Zapier, Make, n8n, or your own API. Receives JSON payloads.",
            "Events sent: section.assigned (section assigned to team member), question.assigned (individual question assigned), rfp.questions_parsed (questions extracted), rfp.completed (all answers approved).",
            "Notifications include the person's name, the RFP title, section/question details, and a link back to the app.",
          ]}
        />

        <Guide
          id="search"
          title="Search"
          content={[
            "Both the Knowledge Base and Answer Library have search bars at the top.",
            "Search is real-time with debounced input (300ms delay).",
            "Knowledge Base search: searches across all document chunk content.",
            "Answer Library search: searches both questions and answers.",
            "Click any search result to view the full content inline (expandable panel).",
            "Results show type badges (Knowledge, Library, Document) and highlighted excerpts.",
          ]}
        />

        <Guide
          id="deleting"
          title="Deleting Items"
          content={[
            "All delete operations require two-step confirmation: click Delete, then confirm with 'Yes, delete'.",
            "Deleting an RFP removes all questions, answers, and the source file from storage.",
            "Deleting a knowledge document removes all associated chunks.",
            "Deleting an answer library entry removes that Q&amp;A pair from reuse.",
            "All deletions are recorded in the audit log.",
          ]}
        />

        <Guide
          id="api-keys"
          title="API Keys (BYOK)"
          content={[
            "AgentRFP uses your own API key &mdash; you pay your AI provider directly.",
            "Supported providers: Anthropic (Claude), OpenAI (GPT-4o), Google (Gemini).",
            "Add keys for multiple providers &mdash; the most recently added key is active (shown with green badge).",
            "Switch providers anytime by adding a new key. Remove keys you no longer use.",
            "Keys are encrypted at rest and only used server-side &mdash; never exposed to the browser.",
            "Only admins can add, update, or remove API keys.",
          ]}
        />

        <Guide
          id="security"
          title="Security &amp; Data Privacy"
          content={[
            "<strong>Zero Data Retention (ZDR):</strong> When using Anthropic's API, their commercial terms include zero data retention. Prompts and responses are not stored or used for training. Similar policies apply to OpenAI and Google's paid API tiers.",
            "<strong>Encryption:</strong> API keys are encrypted at rest. All data in transit uses TLS 1.2+. Supabase provides encryption at rest for all database and storage data.",
            "<strong>Row Level Security:</strong> Every database query is scoped to your organization at the PostgreSQL level. One org can never access another's data.",
            "<strong>Audit Trail:</strong> Every significant action (uploads, edits, approvals, assignments, exports, deletions) is logged with who, what, and when. Admins can review in Settings &rarr; Audit Log.",
            "<strong>No data sharing:</strong> Your RFP data, knowledge base, and answers are never shared with other customers or used for any purpose outside your organization.",
            "<strong>SOC 2:</strong> Supabase and Vercel (infrastructure providers) are both SOC 2 Type II compliant.",
            "For enterprise security requirements (SAML SSO, custom data residency, penetration test reports), contact us.",
          ]}
        />

        <Guide
          id="salesforce"
          title="Salesforce Integration (Coming Soon)"
          content={[
            "Connect AgentRFP to Salesforce to automatically pull RFP opportunities from your pipeline.",
            "Map Salesforce opportunity fields to RFP metadata (due date, account name, deal size).",
            "Push completed RFP responses back to Salesforce as attachments on the opportunity.",
            "This integration is on the roadmap &mdash; contact us if this is a priority for your team.",
          ]}
        />
      </div>
    </div>
  );
}

function Guide({
  id,
  title,
  content,
}: {
  id?: string;
  title: string;
  content: string[];
}) {
  return (
    <div id={id} className="bg-white rounded-xl border border-gray-200 p-6 scroll-mt-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {content.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 flex gap-2">
            <span className="text-gray-300 flex-shrink-0">&#8226;</span>
            <GuideText text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuideText({ text }: { text: string }) {
  // Parse bold tags into React elements
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return (
    <span>
      {parts.map((part, i) => {
        const boldMatch = part.match(/^<strong>(.*?)<\/strong>$/);
        if (boldMatch) {
          return <strong key={i}>{boldMatch[1]}</strong>;
        }
        // Convert HTML entities to text
        return <span key={i}>{part
          .replace(/&mdash;/g, "\u2014")
          .replace(/&rarr;/g, "\u2192")
          .replace(/&middot;/g, "\u00B7")
          .replace(/&amp;/g, "&")
          .replace(/&bull;/g, "\u2022")
        }</span>;
      })}
    </span>
  );
}
