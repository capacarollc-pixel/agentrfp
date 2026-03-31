# AgentRFP.ai — Product Spec

## One-Page PRD

**Product:** AI-native RFP response platform for sales and proposal teams.
**Positioning:** 75% cheaper than Loopio/Responsive. Faster setup. Better AI.
**Target:** Small and mid-market teams (3-20 people) who answer RFPs regularly.
**Pricing:** $49/user/mo (BYOK for AI). Competitors charge $200-500/user/mo.
**Core insight:** Most RFP tools are bloated procurement suites. Teams need: upload RFP → get draft answers from approved knowledge → review → export. That's it.

## Personas

| Persona | Role | Core need |
|---------|------|-----------|
| **Sarah** | Proposal Manager | Upload RFP, get first draft in minutes, assign sections to SMEs, export to Word |
| **Mike** | Sales Engineer | Review AI-drafted technical answers, approve/edit with citations, move fast |
| **Dana** | VP Sales | See pipeline of active RFPs, track win rates, control what knowledge is approved |

## Jobs to Be Done

1. **Import an RFP** and have it parsed into individual questions automatically.
2. **Get draft answers** pulled from our approved knowledge base, with citations.
3. **Review and refine** answers with SME input and confidence scoring.
4. **Export** a polished response in Word/Excel format the customer expects.
5. **Build a knowledge base** that gets smarter with every completed RFP.

## MVP Feature List

| # | Feature | Priority |
|---|---------|----------|
| 1 | Email/password auth + org/workspace setup | P0 |
| 2 | Upload knowledge docs (PDF, DOCX, TXT, URL) | P0 |
| 3 | Document chunking + vector embedding (pgvector) | P0 |
| 4 | Import RFP (PDF/DOCX/XLSX) → parsed question list | P0 |
| 5 | AI draft answers with retrieval from knowledge base | P0 |
| 6 | Inline citations linking answers to source chunks | P0 |
| 7 | Confidence scoring per answer (high/medium/low/no match) | P0 |
| 8 | SME review workflow (assign, approve, request changes) | P1 |
| 9 | Answer library (approved answers, tagged, searchable) | P1 |
| 10 | Export to Word (.docx) | P0 |
| 11 | Export to Excel (.xlsx) | P1 |
| 12 | BYOK API key management (encrypted, per-org) | P0 |
| 13 | Org settings, invite teammates, roles (admin/member) | P0 |
| 14 | Audit log (who changed what, when) | P1 |

## Non-Goals (MVP)

- Self-hosted / on-prem deployment
- SSO / SAML (defer to enterprise tier)
- SharePoint / Google Drive live connectors (manual upload is fine)
- Custom branding / white-label
- Real-time collaborative editing (async review is sufficient)
- Billing / Stripe integration (manual onboarding for first 10 partners)
- Mobile app
- Multi-language support
- Automated RFP scoring / win prediction

## Sitemap

```
/                       → Landing / marketing (later)
/login                  → Sign in
/signup                 → Create account + org
/dashboard              → Active RFPs, recent activity
/rfps                   → List of all RFPs
/rfps/new               → Import new RFP
/rfps/[id]              → RFP workspace (questions + answers)
/rfps/[id]/export       → Export options
/knowledge              → Knowledge base (all documents)
/knowledge/upload       → Upload new documents
/knowledge/[id]         → Document detail + chunks
/library                → Answer library (approved Q&A pairs)
/settings               → Org settings
/settings/team          → Team members + invites
/settings/api-keys      → BYOK Anthropic key
/settings/audit-log     → Activity log
```

## Data Model

### organizations
- id (uuid, PK)
- name (text)
- created_at (timestamptz)

### users
- id (uuid, PK, matches Supabase auth.users)
- org_id (uuid, FK → organizations)
- email (text)
- full_name (text)
- role (enum: admin, member)
- created_at (timestamptz)

### api_keys
- id (uuid, PK)
- org_id (uuid, FK → organizations)
- provider (text, default 'anthropic')
- encrypted_key (text)
- created_at (timestamptz)
- created_by (uuid, FK → users)

### documents
- id (uuid, PK)
- org_id (uuid, FK → organizations)
- title (text)
- file_type (text)
- file_path (text — Supabase storage path)
- status (enum: processing, ready, error)
- chunk_count (int)
- uploaded_by (uuid, FK → users)
- created_at (timestamptz)

### chunks
- id (uuid, PK)
- document_id (uuid, FK → documents)
- org_id (uuid, FK → organizations)
- content (text)
- embedding (vector(1536))
- chunk_index (int)
- metadata (jsonb)
- created_at (timestamptz)

### rfps
- id (uuid, PK)
- org_id (uuid, FK → organizations)
- title (text)
- status (enum: draft, in_progress, review, completed)
- source_file_path (text)
- due_date (timestamptz, nullable)
- created_by (uuid, FK → users)
- created_at (timestamptz)

### questions
- id (uuid, PK)
- rfp_id (uuid, FK → rfps)
- org_id (uuid, FK → organizations)
- question_text (text)
- section (text, nullable)
- order_index (int)
- status (enum: pending, drafted, in_review, approved)
- assigned_to (uuid, FK → users, nullable)
- created_at (timestamptz)

### answers
- id (uuid, PK)
- question_id (uuid, FK → questions)
- org_id (uuid, FK → organizations)
- content (text)
- confidence (enum: high, medium, low, none)
- is_ai_generated (boolean)
- created_by (uuid, FK → users, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

### citations
- id (uuid, PK)
- answer_id (uuid, FK → answers)
- chunk_id (uuid, FK → chunks)
- relevance_score (float)

### answer_library
- id (uuid, PK)
- org_id (uuid, FK → organizations)
- question (text)
- answer (text)
- tags (text[])
- version (int)
- approved_by (uuid, FK → users, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

### audit_log
- id (uuid, PK)
- org_id (uuid, FK → organizations)
- user_id (uuid, FK → users)
- action (text)
- entity_type (text)
- entity_id (uuid)
- metadata (jsonb)
- created_at (timestamptz)

## API Endpoints

### Auth
- POST /api/auth/signup — create account + org
- POST /api/auth/login — sign in
- POST /api/auth/invite — invite teammate

### Knowledge Base
- POST /api/documents/upload — upload file, start processing
- GET /api/documents — list org documents
- GET /api/documents/[id] — document detail + chunks
- DELETE /api/documents/[id] — remove document
- POST /api/documents/[id]/reprocess — re-chunk and re-embed

### RFPs
- POST /api/rfps — create/import RFP
- GET /api/rfps — list org RFPs
- GET /api/rfps/[id] — RFP detail with questions
- PATCH /api/rfps/[id] — update RFP metadata
- DELETE /api/rfps/[id] — delete RFP

### Questions & Answers
- POST /api/rfps/[id]/generate — generate AI answers for all questions
- PATCH /api/questions/[id] — update question (assign, status)
- PUT /api/answers/[id] — edit answer
- POST /api/answers/[id]/approve — approve answer

### Export
- POST /api/rfps/[id]/export/docx — export to Word
- POST /api/rfps/[id]/export/xlsx — export to Excel

### Settings
- GET /api/org — org details
- PATCH /api/org — update org
- POST /api/org/api-keys — save BYOK key
- GET /api/org/team — list members
- GET /api/org/audit-log — audit log entries

## AI Prompt Flow

### 1. Document Ingestion
```
Upload → Extract text (PDF/DOCX parser) → Split into chunks (~500 tokens)
→ Generate embeddings (voyage-3 or text-embedding-3-small via API)
→ Store chunks + vectors in pgvector
```

### 2. RFP Import
```
Upload RFP file → Extract text → Send to Claude:
"Extract every question from this RFP. Return as JSON array with:
 - question_text
 - section (if identifiable)
 - order_index"
→ Store parsed questions
```

### 3. Answer Generation (per question)
```
1. Embed the question
2. Vector search: top 5 most relevant chunks from org's knowledge base
3. Prompt Claude:
   "You are answering an RFP question for [org_name].
    Question: {question}

    Approved source material:
    [1] {chunk_1.content} (from: {document_title})
    [2] {chunk_2.content} (from: {document_title})
    ...

    Rules:
    - Answer ONLY using the provided source material.
    - Cite sources inline as [1], [2], etc.
    - If the sources don't cover the question, say so explicitly.
    - Be concise and professional.
    - Do not fabricate claims."
4. Parse response → extract citations → compute confidence score
5. Store answer + citation links
```

### 4. Confidence Scoring
| Score | Criteria |
|-------|----------|
| High | 2+ relevant chunks, similarity > 0.8, answer fully addresses question |
| Medium | 1-2 relevant chunks, similarity 0.6-0.8, partial coverage |
| Low | Chunks found but similarity < 0.6, answer is thin |
| None | No relevant chunks found, AI flagged as unsupported |

## Answer Quality Evaluation

| Criterion | Measurement |
|-----------|-------------|
| Factual accuracy | Every claim must trace to a cited source chunk |
| Completeness | Answer addresses all parts of the question |
| Conciseness | No filler, no repetition |
| Citation validity | Cited chunks actually support the claim |
| Confidence calibration | High-confidence answers should rarely need SME edits |

## Acceptance Criteria

| Feature | Acceptance criteria |
|---------|-------------------|
| Auth | User can sign up, create org, log in, log out. Passwords hashed. Sessions persist. |
| Upload docs | PDF/DOCX/TXT upload succeeds. File stored in Supabase storage. Processing status shown. |
| Chunking | Document split into chunks. Embeddings generated. Chunks searchable via vector similarity. |
| Import RFP | PDF/DOCX/XLSX uploaded. Questions extracted and displayed as list. User can edit/reorder. |
| AI answers | Each question gets a draft answer. Citations link to source chunks. Confidence score assigned. |
| SME review | Questions assignable to team members. Status transitions: pending → drafted → in_review → approved. |
| Export DOCX | Generates a .docx file with questions, answers, and citations. Downloads in browser. |
| BYOK | Org admin can save API key. Key encrypted at rest. Used for all AI calls. Clear error if missing. |
| Team mgmt | Admin can invite by email. New user joins the org. Roles enforced. |
| Audit log | All significant actions logged with timestamp, user, action, entity. Viewable by admin. |

## Launch Plan — First 10 Design Partners

| Week | Milestone |
|------|-----------|
| 1-2 | Core app: auth, upload, knowledge base, RFP import |
| 3-4 | AI answers with citations, confidence scoring, export |
| 5 | SME review workflow, answer library |
| 6 | Polish, bug fixes, onboarding flow |
| 7 | Invite 3 design partners (warm leads), gather feedback |
| 8-9 | Iterate on feedback, fix top issues |
| 10 | Invite 7 more partners, start collecting testimonials |

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, fast, great DX |
| UI | Tailwind CSS + shadcn/ui | Clean, modern, customizable |
| Auth | Supabase Auth | Free, battle-tested, handles sessions |
| Database | Supabase Postgres + pgvector | SQL + vectors in one place |
| File storage | Supabase Storage | Integrated, free tier generous |
| AI | Claude API (BYOK) | Best for structured extraction and writing |
| Embeddings | Voyage AI or OpenAI embeddings | Good quality, cheap |
| PDF parsing | pdf-parse (npm) | Simple, works |
| DOCX parsing | mammoth (npm) | Reliable HTML extraction |
| DOCX export | docx (npm) | Programmatic Word generation |
| XLSX | xlsx (npm, SheetJS) | Parse and generate spreadsheets |
| Hosting | Vercel | Auto-deploy from GitHub, free tier |

## Assumptions

1. BYOK-only for MVP — no managed AI billing.
2. Manual onboarding — no self-serve billing/Stripe for first 10 partners.
3. Embeddings via OpenAI text-embedding-3-small (cheap, good enough) — customers provide this key too, or we use a free/built-in option.
4. No real-time collab — async review workflow is sufficient.
5. English-only for MVP.
6. File size limit: 50MB per upload.
7. Max 500 questions per RFP (reasonable upper bound).
