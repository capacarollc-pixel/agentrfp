-- AI traceability: track which chunks were used to generate each answer
create table answer_sources (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  chunk_id uuid not null references chunks(id) on delete cascade,
  relevance_rank int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_answer_sources_answer on answer_sources(answer_id);

alter table answer_sources enable row level security;
create policy "Users see org answer_sources" on answer_sources
  for all using (
    answer_id in (select id from answers where org_id = public.get_user_org_id())
  );

-- Assignment rules (natural language rules for auto-assignment)
create table assignment_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  rule_text text not null,
  assign_to uuid not null references users(id),
  priority int not null default 0,
  enabled boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index idx_assignment_rules_org on assignment_rules(org_id);

alter table assignment_rules enable row level security;
create policy "Users see org assignment_rules" on assignment_rules
  for all using (org_id = public.get_user_org_id());
