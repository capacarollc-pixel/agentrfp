-- Answer versions table (tracks edit history)
create table answer_versions (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  content text not null,
  version_number int not null,
  edited_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Add approval tracking fields to answers
alter table answers add column if not exists approved_by uuid references users(id);
alter table answers add column if not exists approved_at timestamptz;
alter table answers add column if not exists version_number int not null default 1;

-- Add auto_generate flag to rfps
alter table rfps add column if not exists auto_generated boolean not null default false;

-- Add compliance fields to organizations
alter table organizations add column if not exists require_approval_for_export boolean not null default true;

-- Indexes
create index idx_answer_versions_answer on answer_versions(answer_id);
create index idx_answer_versions_org on answer_versions(org_id);

-- RLS
alter table answer_versions enable row level security;
create policy "Users see org answer_versions" on answer_versions
  for all using (org_id = public.get_user_org_id());
