-- Org-level usage limits and plan tier
alter table organizations add column if not exists plan text not null default 'free'
  check (plan in ('free', 'starter', 'pro', 'enterprise'));
alter table organizations add column if not exists storage_limit_mb int not null default 100;
alter table organizations add column if not exists doc_limit int not null default 10;
alter table organizations add column if not exists rfp_limit int not null default 5;
alter table organizations add column if not exists user_limit int not null default 3;
