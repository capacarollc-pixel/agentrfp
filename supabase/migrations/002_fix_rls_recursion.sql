-- Fix infinite recursion in RLS policies
-- The users table policy can't reference itself, so we use auth.uid() directly

-- Drop all existing policies
drop policy if exists "Users see own org" on organizations;
drop policy if exists "Users see org members" on users;
drop policy if exists "Users see org api_keys" on api_keys;
drop policy if exists "Users see org documents" on documents;
drop policy if exists "Users see org chunks" on chunks;
drop policy if exists "Users see org rfps" on rfps;
drop policy if exists "Users see org questions" on questions;
drop policy if exists "Users see org answers" on answers;
drop policy if exists "Users see org citations" on citations;
drop policy if exists "Users see org answer_library" on answer_library;
drop policy if exists "Users see org audit_log" on audit_log;

-- Users table: simply allow users to see their own row
create policy "Users see own row" on users
  for select using (id = auth.uid());

-- Create a security-definer function to get org_id without triggering RLS
create or replace function public.get_user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select public.users.org_id from public.users where public.users.id = auth.uid()
$$;

-- Organizations: use the helper function
create policy "Users see own org" on organizations
  for select using (id = get_user_org_id());

-- All other tables: use the helper function
create policy "Users see org api_keys" on api_keys
  for all using (org_id = get_user_org_id());

create policy "Users see org documents" on documents
  for all using (org_id = get_user_org_id());

create policy "Users see org chunks" on chunks
  for all using (org_id = get_user_org_id());

create policy "Users see org rfps" on rfps
  for all using (org_id = get_user_org_id());

create policy "Users see org questions" on questions
  for all using (org_id = get_user_org_id());

create policy "Users see org answers" on answers
  for all using (org_id = get_user_org_id());

create policy "Users see org citations" on citations
  for all using (org_id in (
    select a.org_id from answers a where a.id = citations.answer_id
  ));

create policy "Users see org answer_library" on answer_library
  for all using (org_id = get_user_org_id());

create policy "Users see org audit_log" on audit_log
  for select using (org_id = get_user_org_id());
