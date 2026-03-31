-- Integrations table
create table integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type text not null check (type in ('slack', 'teams', 'google_sheets', 'webhook')),
  name text not null,
  webhook_url text,
  config jsonb default '{}',
  enabled boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index idx_integrations_org on integrations(org_id);

alter table integrations enable row level security;
create policy "Users see org integrations" on integrations
  for all using (org_id = public.get_user_org_id());
