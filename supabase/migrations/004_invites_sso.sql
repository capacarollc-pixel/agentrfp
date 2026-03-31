-- Team invites
create table invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid references users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(org_id, email)
);

-- Auto-join domain (e.g., anyone with @acme.com auto-joins Acme's org)
alter table organizations add column if not exists allowed_domain text;

create index idx_invites_email on invites(email);
create index idx_invites_org on invites(org_id);

alter table invites enable row level security;
create policy "Users see org invites" on invites
  for all using (org_id = public.get_user_org_id());
