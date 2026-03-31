-- Enterprise connectors (OAuth-based integrations)
create table connectors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type text not null check (type in ('servicenow', 'coupa', 'ariba', 'salesforce')),
  name text not null,
  instance_url text not null,
  client_id text,
  client_secret_encrypted text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  config jsonb default '{}',
  enabled boolean not null default true,
  last_sync_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index idx_connectors_org on connectors(org_id);

alter table connectors enable row level security;
create policy "Users see org connectors" on connectors
  for all using (org_id = public.get_user_org_id());

-- Sync log for tracking import/export history
create table connector_sync_log (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid not null references connectors(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  direction text not null check (direction in ('import', 'export')),
  status text not null check (status in ('success', 'error', 'partial')),
  records_processed int not null default 0,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_sync_log_connector on connector_sync_log(connector_id);

alter table connector_sync_log enable row level security;
create policy "Users see org sync_log" on connector_sync_log
  for all using (org_id = public.get_user_org_id());
