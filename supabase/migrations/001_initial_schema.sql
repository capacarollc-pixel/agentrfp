-- Enable pgvector extension
create extension if not exists vector;

-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Users (linked to Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

-- API keys (BYOK, encrypted)
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider text not null default 'anthropic',
  encrypted_key text not null,
  created_at timestamptz not null default now(),
  created_by uuid references users(id)
);

-- Knowledge base documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  file_type text not null,
  file_path text not null,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  chunk_count int not null default 0,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Document chunks with vector embeddings
create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  chunk_index int not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- RFPs
create table rfps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'review', 'completed')),
  source_file_path text,
  due_date timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- RFP questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  rfp_id uuid not null references rfps(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  question_text text not null,
  section text,
  order_index int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'drafted', 'in_review', 'approved')),
  assigned_to uuid references users(id),
  created_at timestamptz not null default now()
);

-- Answers
create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  content text not null,
  confidence text not null default 'none' check (confidence in ('high', 'medium', 'low', 'none')),
  is_ai_generated boolean not null default false,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Citations linking answers to source chunks
create table citations (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  chunk_id uuid not null references chunks(id) on delete cascade,
  relevance_score float not null default 0
);

-- Answer library (reusable approved answers)
create table answer_library (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  question text not null,
  answer text not null,
  tags text[] default '{}',
  version int not null default 1,
  approved_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit log
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_users_org on users(org_id);
create index idx_documents_org on documents(org_id);
create index idx_chunks_document on chunks(document_id);
create index idx_chunks_org on chunks(org_id);
create index idx_rfps_org on rfps(org_id);
create index idx_questions_rfp on questions(rfp_id);
create index idx_questions_org on questions(org_id);
create index idx_answers_question on answers(question_id);
create index idx_citations_answer on citations(answer_id);
create index idx_answer_library_org on answer_library(org_id);
create index idx_audit_log_org on audit_log(org_id);
create index idx_audit_log_created on audit_log(created_at desc);

-- Vector similarity search index (IVFFlat for good performance)
create index idx_chunks_embedding on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Row Level Security
alter table organizations enable row level security;
alter table users enable row level security;
alter table api_keys enable row level security;
alter table documents enable row level security;
alter table chunks enable row level security;
alter table rfps enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table citations enable row level security;
alter table answer_library enable row level security;
alter table audit_log enable row level security;

-- RLS policies: users can only access data in their org
create policy "Users see own org" on organizations
  for select using (id in (select org_id from users where id = auth.uid()));

create policy "Users see org members" on users
  for select using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org api_keys" on api_keys
  for all using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org documents" on documents
  for all using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org chunks" on chunks
  for all using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org rfps" on rfps
  for all using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org questions" on questions
  for all using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org answers" on answers
  for all using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org citations" on citations
  for all using (
    answer_id in (
      select a.id from answers a
      join questions q on a.question_id = q.id
      join rfps r on q.rfp_id = r.id
      where r.org_id in (select org_id from users where id = auth.uid())
    )
  );

create policy "Users see org answer_library" on answer_library
  for all using (org_id in (select org_id from users where id = auth.uid()));

create policy "Users see org audit_log" on audit_log
  for select using (org_id in (select org_id from users where id = auth.uid()));

-- Function for vector similarity search
create or replace function match_chunks(
  query_embedding vector(1536),
  match_org_id uuid,
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where chunks.org_id = match_org_id
    and 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
