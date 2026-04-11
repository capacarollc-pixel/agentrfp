-- Stripe subscription tracking
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null default 'inactive',
  seats int not null default 1,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id)
);

-- Index for webhook lookups
create index if not exists idx_subscriptions_stripe_customer
  on subscriptions(stripe_customer_id);

create index if not exists idx_subscriptions_stripe_sub
  on subscriptions(stripe_subscription_id);

-- RLS: org members can read their own subscription
alter table subscriptions enable row level security;

create policy "Users can view their org subscription"
  on subscriptions for select
  using (org_id in (select org_id from users where id = auth.uid()));

-- Only service role (webhooks) can insert/update
create policy "Service role manages subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role');
