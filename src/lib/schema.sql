-- Resumeefy production schema for Supabase.
-- Run this once in Supabase SQL Editor.
-- Supabase Auth is the source of truth for identities and passwords.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null unique,
  role text not null default 'user' check (role in ('user','admin')),
  target_role text,
  target_company text,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id text primary key,
  email text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  target_role text,
  target_company text,
  scores_json jsonb not null default '{}'::jsonb,
  overall_score integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  data_json jsonb not null default '{}'::jsonb,
  is_unlocked boolean not null default false,
  selected_tier text not null default 'boost',
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  resume_id text references public.resumes(id) on delete set null,
  tx_ref text not null unique,
  flw_transaction_id text,
  amount integer not null,
  currency text not null default 'NGN',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.tracking_events (
  id text primary key,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assessments_user on public.assessments(user_id);
create index if not exists idx_assessments_completed on public.assessments(completed_at desc);
create index if not exists idx_resumes_user on public.resumes(user_id);
create index if not exists idx_resumes_updated on public.resumes(updated_at desc);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_tx_ref on public.payments(tx_ref);
create index if not exists idx_tracking_name on public.tracking_events(name);
create index if not exists idx_tracking_created on public.tracking_events(created_at desc);

alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.assessments enable row level security;
alter table public.resumes enable row level security;
alter table public.payments enable row level security;
alter table public.tracking_events enable row level security;

-- Server operations use SUPABASE_SERVICE_ROLE_KEY and therefore bypass RLS.
-- Never expose that key in NEXT_PUBLIC_* variables or browser code.


-- Credit economy
create table if not exists public.credit_wallets (
  user_id uuid primary key references public.users(id) on delete cascade,
  balance integer not null default 100 check (balance >= 0),
  lifetime_earned integer not null default 100,
  lifetime_spent integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  type text not null check (type in ('signup_bonus','purchase','spend','refund','admin_adjustment','daily_login','user_referral')),
  feature text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_purchases (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  pack_id text not null,
  credits integer not null,
  amount numeric not null,
  currency text not null,
  tx_ref text not null unique,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.courses (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  target_role text,
  source text not null default 'ai',
  difficulty text,
  estimated_hours numeric,
  hero_type text,
  hero_asset text,
  content_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_submissions (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  project_url text,
  submission_text text,
  submitted_at timestamptz,
  deadline_at timestamptz,
  status text not null default 'pending',
  unlock_credit_cost integer not null default 20,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  topic text,
  source_signals jsonb not null default '{}'::jsonb,
  marketing jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  primary_keyword text,
  search_intent text,
  word_count integer not null default 0,
  cover_type text not null default 'gradient',
  cover_asset text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.blog_events (
  id text primary key,
  blog_id text not null references public.blog_posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.blog_posts add column if not exists marketing jsonb not null default '{}'::jsonb;
alter table public.blog_posts add column if not exists seo_title text;
alter table public.blog_posts add column if not exists seo_description text;
alter table public.blog_posts add column if not exists primary_keyword text;
alter table public.blog_posts add column if not exists search_intent text;
alter table public.blog_posts add column if not exists word_count integer not null default 0;

create or replace function public.ensure_credit_wallet(p_user_id uuid, p_bonus integer default 100)
returns public.credit_wallets language plpgsql security definer set search_path=public as $$
declare w public.credit_wallets;
begin
  insert into public.credit_wallets(user_id,balance,lifetime_earned) values(p_user_id,p_bonus,p_bonus) on conflict(user_id) do nothing;
  select * into w from public.credit_wallets where user_id=p_user_id;
  return w;
end; $$;

create or replace function public.spend_credits(p_user_id uuid, p_amount integer, p_feature text, p_reference_id text default null)
returns public.credit_wallets language plpgsql security definer set search_path=public as $$
declare w public.credit_wallets; new_balance integer;
begin
  if p_amount <= 0 then raise exception 'Credit amount must be positive'; end if;
  select * into w from public.credit_wallets where user_id=p_user_id for update;
  if not found then perform public.ensure_credit_wallet(p_user_id,100); select * into w from public.credit_wallets where user_id=p_user_id for update; end if;
  if w.balance < p_amount then raise exception 'INSUFFICIENT_CREDITS'; end if;
  new_balance := w.balance - p_amount;
  update public.credit_wallets set balance=new_balance,lifetime_spent=lifetime_spent+p_amount,updated_at=now() where user_id=p_user_id returning * into w;
  insert into public.credit_transactions(id,user_id,amount,balance_after,type,feature,reference_id) values('cr_'||replace(gen_random_uuid()::text,'-',''),p_user_id,-p_amount,new_balance,'spend',p_feature,p_reference_id);
  return w;
end; $$;

create or replace function public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_feature text default null, p_reference_id text default null, p_metadata jsonb default '{}'::jsonb)
returns public.credit_wallets language plpgsql security definer set search_path=public as $$
declare w public.credit_wallets; new_balance integer;
begin
  if p_amount <= 0 then raise exception 'Credit amount must be positive'; end if;
  perform public.ensure_credit_wallet(p_user_id,0);
  select * into w from public.credit_wallets where user_id=p_user_id for update;
  new_balance := w.balance + p_amount;
  update public.credit_wallets set balance=new_balance,lifetime_earned=lifetime_earned+p_amount,updated_at=now() where user_id=p_user_id returning * into w;
  insert into public.credit_transactions(id,user_id,amount,balance_after,type,feature,reference_id,metadata) values('cr_'||replace(gen_random_uuid()::text,'-',''),p_user_id,p_amount,new_balance,p_type,p_feature,p_reference_id,p_metadata);
  return w;
end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id,name,email) values(new.id,coalesce(new.raw_user_meta_data->>'name',''),coalesce(new.email,'')) on conflict(id) do update set name=excluded.name,email=excluded.email;
  perform public.ensure_credit_wallet(new.id,100);
  insert into public.credit_transactions(id,user_id,amount,balance_after,type,feature) values('cr_'||replace(gen_random_uuid()::text,'-',''),new.id,100,100,'signup_bonus','signup');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create index if not exists idx_credit_tx_user on public.credit_transactions(user_id,created_at desc);
create index if not exists idx_course_user on public.courses(user_id,updated_at desc);
create index if not exists idx_blog_published on public.blog_posts(published_at desc);
create index if not exists idx_blog_events on public.blog_events(blog_id,created_at desc);

alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.credit_purchases enable row level security;
alter table public.courses enable row level security;
alter table public.course_submissions enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_events enable row level security;

-- Affiliate tables must exist before purchase completion can award commissions.
create table if not exists public.affiliates (
  id text primary key, user_id uuid not null unique references public.users(id) on delete cascade, code text not null unique, display_name text not null default '',
  status text not null default 'active' check (status in ('active','suspended','pending')), commission_rate numeric(5,4) not null default 0.40,
  total_clicks bigint not null default 0, total_signups bigint not null default 0, total_sales bigint not null default 0, total_credits bigint not null default 0,
  total_commission numeric(18,2) not null default 0, pending_commission numeric(18,2) not null default 0, paid_commission numeric(18,2) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.affiliate_commissions (
  id text primary key, affiliate_id text not null references public.affiliates(id) on delete cascade, user_id uuid references public.users(id) on delete set null,
  purchase_id text not null unique references public.credit_purchases(id) on delete cascade, amount numeric(18,2) not null, currency text not null, rate numeric(5,4) not null default 0.40,
  status text not null default 'pending' check (status in ('pending','approved','paid','reversed')), paid_amount numeric(18,2) not null default 0, created_at timestamptz not null default now(), paid_at timestamptz
);
alter table public.credit_purchases add column if not exists affiliate_id text references public.affiliates(id) on delete set null;
alter table public.credit_purchases add column if not exists affiliate_code text;
alter table public.credit_purchases add column if not exists affiliate_commission numeric(18,2) not null default 0;
alter table public.credit_purchases add column if not exists affiliate_commission_status text not null default 'none';
alter table public.credit_purchases add column if not exists currency_rate numeric;
alter table public.credit_purchases add column if not exists country text;
alter table public.affiliate_commissions add column if not exists paid_amount numeric(18,2) not null default 0;
alter table public.affiliates add column if not exists payout_account_number text;
alter table public.affiliates add column if not exists payout_account_name text;
alter table public.affiliates add column if not exists payout_bank_name text;

create or replace function public.complete_credit_purchase(p_tx_ref text)
returns public.credit_purchases language plpgsql security definer set search_path=public as $$
declare p public.credit_purchases; commission numeric := 0;
begin
  select * into p from public.credit_purchases where tx_ref=p_tx_ref for update;
  if not found then raise exception 'Credit purchase not found'; end if;
  if p.status <> 'successful' then
    commission := coalesce(p.affiliate_commission, 0);
    update public.credit_purchases set status='successful',completed_at=now(),affiliate_commission=commission,affiliate_commission_status=case when affiliate_id is null then 'none' else 'pending' end where tx_ref=p_tx_ref returning * into p;
    perform public.add_credits(p.user_id,p.credits,'purchase','credit_pack',p.id,jsonb_build_object('packId',p.pack_id,'currency',p.currency,'amount',p.amount,'affiliateCode',p.affiliate_code));
    if p.affiliate_id is not null and commission > 0 then
      update public.affiliates set total_sales=total_sales+1,total_credits=total_credits+p.credits,total_commission=total_commission+commission,pending_commission=pending_commission+commission,updated_at=now() where id=p.affiliate_id;
      insert into public.affiliate_commissions(id,affiliate_id,user_id,purchase_id,amount,currency,rate,status,created_at) values('ac_'||replace(gen_random_uuid()::text,'-',''),p.affiliate_id,p.user_id,p.id,commission,p.currency,0.40,'pending',now());
    end if;
  end if;
  return p;
end; $$;

-- Backfill wallets for users that already existed before the credit system was installed.
insert into public.credit_wallets(user_id,balance,lifetime_earned)
select id,100,100 from public.users
on conflict(user_id) do nothing;


-- Affiliate referral system. Attribution is first-party and expires after 60 days.
create table if not exists public.affiliates (
  id text primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  code text not null unique,
  display_name text not null default '',
  status text not null default 'active' check (status in ('active','suspended','pending')),
  commission_rate numeric(5,4) not null default 0.40,
  total_clicks bigint not null default 0,
  total_signups bigint not null default 0,
  total_sales bigint not null default 0,
  total_credits bigint not null default 0,
  total_commission numeric(18,2) not null default 0,
  pending_commission numeric(18,2) not null default 0,
  paid_commission numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stores referred email signups before and after account creation so affiliate attribution
-- remains auditable and can be reconciled with future credit purchases.
create table if not exists public.affiliate_referral_leads (
  id text primary key,
  affiliate_id text references public.affiliates(id) on delete set null,
  affiliate_code text not null,
  email text not null,
  user_id uuid references public.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(email, affiliate_code)
);

create table if not exists public.referral_clicks (
  id text primary key,
  affiliate_id text not null references public.affiliates(id) on delete cascade,
  code text not null,
  landing_path text,
  source text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_attributions (
  id text primary key,
  affiliate_id text not null references public.affiliates(id) on delete cascade,
  user_id uuid not null unique references public.users(id) on delete cascade,
  code text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_commissions (
  id text primary key,
  affiliate_id text not null references public.affiliates(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  purchase_id text not null unique references public.credit_purchases(id) on delete cascade,
  amount numeric(18,2) not null,
  currency text not null,
  rate numeric(5,4) not null default 0.40,
  status text not null default 'pending' check (status in ('pending','approved','paid','reversed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.affiliate_payout_requests (
  id text primary key,
  affiliate_id text not null references public.affiliates(id) on delete cascade,
  amount numeric(18,2) not null,
  currency text not null,
  status text not null default 'requested' check (status in ('requested','approved','paid','rejected')),
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.credit_purchases add column if not exists affiliate_id text references public.affiliates(id) on delete set null;
alter table public.credit_purchases add column if not exists affiliate_code text;
alter table public.credit_purchases add column if not exists affiliate_commission numeric(18,2) not null default 0;
alter table public.credit_purchases add column if not exists affiliate_commission_status text not null default 'none';
alter table public.credit_purchases add column if not exists currency_rate numeric;
alter table public.credit_purchases add column if not exists country text;
alter table public.affiliate_commissions add column if not exists paid_amount numeric(18,2) not null default 0;

alter table public.affiliates enable row level security;
alter table public.affiliate_referral_leads enable row level security;
alter table public.referral_clicks enable row level security;
alter table public.affiliate_attributions enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_payout_requests enable row level security;

create index if not exists idx_affiliate_code on public.affiliates(code);
create index if not exists idx_affiliate_referral_leads_email on public.affiliate_referral_leads(email);
create index if not exists idx_affiliate_referral_leads_affiliate on public.affiliate_referral_leads(affiliate_id,created_at desc);
create index if not exists idx_referral_clicks_affiliate on public.referral_clicks(affiliate_id,created_at desc);
create index if not exists idx_affiliate_commissions_affiliate on public.affiliate_commissions(affiliate_id,created_at desc);
create index if not exists idx_affiliate_payouts_affiliate on public.affiliate_payout_requests(affiliate_id,created_at desc);
create index if not exists idx_credit_purchase_affiliate on public.credit_purchases(affiliate_id,created_at desc);

create or replace function public.record_affiliate_lead(p_code text, p_email text, p_user_id uuid default null)
returns public.affiliate_referral_leads language plpgsql security definer set search_path=public as $$
declare a public.affiliates; l public.affiliate_referral_leads;
begin
  select * into a from public.affiliates where upper(code)=upper(trim(p_code)) and status='active' limit 1;
  if not found then raise exception 'Affiliate code not found'; end if;
  insert into public.affiliate_referral_leads(id,affiliate_id,affiliate_code,email,user_id,expires_at,converted_at)
  values('arl_'||replace(gen_random_uuid()::text,'-',''),a.id,a.code,lower(trim(p_email)),p_user_id,now()+interval '60 days',case when p_user_id is null then null else now() end)
  on conflict(email,affiliate_code) do update set affiliate_id=excluded.affiliate_id,user_id=coalesce(excluded.user_id,affiliate_referral_leads.user_id),last_seen_at=now(),expires_at=greatest(affiliate_referral_leads.expires_at,excluded.expires_at),converted_at=coalesce(affiliate_referral_leads.converted_at,excluded.converted_at)
  returning * into l;
  if p_user_id is not null then
    update public.affiliates set updated_at=now() where id=a.id;
  end if;
  return l;
end; $$;

create or replace function public.record_affiliate_click(p_affiliate_id text, p_code text, p_path text default null, p_source text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.referral_clicks(id,affiliate_id,code,landing_path,source,user_agent) values('rc_'||replace(gen_random_uuid()::text,'-',''),p_affiliate_id,p_code,p_path,p_source,left(coalesce(p_user_agent,''),500));
  update public.affiliates set total_clicks=total_clicks+1,updated_at=now() where id=p_affiliate_id;
end; $$;

create or replace function public.record_affiliate_attribution(p_user_id uuid, p_code text)
returns public.affiliates language plpgsql security definer set search_path=public as $$
declare a public.affiliates; existing public.affiliate_attributions;
begin
  select * into a from public.affiliates where upper(code)=upper(p_code) and status='active' limit 1;
  if not found then return null; end if;
  select * into existing from public.affiliate_attributions where user_id=p_user_id for update;
  if found and existing.expires_at > now() then
    if existing.code = a.code then
      update public.affiliate_attributions set last_seen_at=now() where user_id=p_user_id;
    else
      update public.affiliate_attributions set affiliate_id=a.id,code=a.code,last_seen_at=now(),expires_at=now()+interval '60 days' where user_id=p_user_id;
    end if;
    return a;
  end if;
  if found then
    update public.affiliate_attributions set affiliate_id=a.id,code=a.code,first_seen_at=now(),last_seen_at=now(),expires_at=now()+interval '60 days' where user_id=p_user_id;
  else
    insert into public.affiliate_attributions(id,affiliate_id,user_id,code,expires_at) values('aa_'||replace(gen_random_uuid()::text,'-',''),a.id,p_user_id,a.code,now()+interval '60 days');
  end if;
  update public.affiliate_referral_leads set user_id=p_user_id,converted_at=coalesce(converted_at,now()),last_seen_at=now() where lower(email)=(select lower(email) from public.users where id=p_user_id) and affiliate_id=a.id and expires_at >= now();
  update public.affiliates set total_signups=total_signups+1,updated_at=now() where id=a.id;
  return a;
end; $$;

create or replace function public.mark_affiliate_payout_paid(p_payout_id text)
returns void language plpgsql security definer set search_path=public as $$
declare p public.affiliate_payout_requests; remaining numeric; c record; available numeric; take_amount numeric;
begin
  select * into p from public.affiliate_payout_requests where id=p_payout_id for update;
  if not found then raise exception 'Payout request not found'; end if;
  if p.status <> 'paid' then
    select coalesce(sum(amount-paid_amount),0) into available from public.affiliate_commissions where affiliate_id=p.affiliate_id and currency=p.currency and status in ('pending','approved');
    if available < p.amount then raise exception 'Not enough unpaid commission in this currency'; end if;
    remaining := p.amount;
    for c in select id,amount,paid_amount from public.affiliate_commissions where affiliate_id=p.affiliate_id and currency=p.currency and status in ('pending','approved') order by created_at asc for update loop
      exit when remaining <= 0;
      take_amount := least(c.amount - c.paid_amount, remaining);
      update public.affiliate_commissions set paid_amount=paid_amount+take_amount,status=case when paid_amount+take_amount >= amount then 'paid' else status end,paid_at=case when paid_amount+take_amount >= amount then now() else paid_at end where id=c.id;
      remaining := remaining - take_amount;
    end loop;
    update public.affiliate_payout_requests set status='paid',resolved_at=now() where id=p.id;
    update public.affiliates set pending_commission=greatest(0,pending_commission-p.amount),paid_commission=paid_commission+p.amount,updated_at=now() where id=p.affiliate_id;
  end if;
end; $$;


-- User growth rewards. These are deliberately small so rewards encourage engagement
-- and sharing without replacing paid credit purchases.
alter table public.users add column if not exists invite_code text;

create table if not exists public.user_referrals (
  id text primary key,
  inviter_user_id uuid not null references public.users(id) on delete cascade,
  invitee_user_id uuid references public.users(id) on delete set null,
  invitee_email text not null,
  invite_code text not null,
  status text not null default 'pending' check (status in ('pending','completed','rejected')),
  inviter_reward integer not null default 10,
  invitee_reward integer not null default 5,
  attributed_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(invitee_email, invite_code)
);

create table if not exists public.daily_login_rewards (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  reward_date date not null,
  credits integer not null default 1,
  created_at timestamptz not null default now(),
  unique(user_id, reward_date)
);

create index if not exists idx_users_invite_code on public.users(invite_code);
create index if not exists idx_user_referrals_inviter on public.user_referrals(inviter_user_id,created_at desc);
create index if not exists idx_user_referrals_invitee on public.user_referrals(invitee_user_id);
create index if not exists idx_daily_login_rewards_user on public.daily_login_rewards(user_id,reward_date desc);

create or replace function public.generate_user_invite_code()
returns text language plpgsql as $$
declare c text;
begin
  loop
    c := 'RFX' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    exit when not exists(select 1 from public.users where invite_code=c);
  end loop;
  return c;
end; $$;

create or replace function public.ensure_user_invite_code()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.invite_code is null or trim(new.invite_code)='' then
    update public.users set invite_code=public.generate_user_invite_code() where id=new.id and (invite_code is null or trim(invite_code)='');
  end if;
  return new;
end; $$;

drop trigger if exists ensure_user_invite_code on public.users;
create trigger ensure_user_invite_code after insert on public.users for each row execute procedure public.ensure_user_invite_code();

-- Backfill invite codes for existing accounts.
do $$
declare u record;
begin
  for u in select id from public.users where invite_code is null or trim(invite_code)='' loop
    update public.users set invite_code=public.generate_user_invite_code() where id=u.id;
  end loop;
end $$;

create or replace function public.claim_daily_login_reward(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare reward integer := 1; today date := current_date; inserted_count integer;
w public.credit_wallets;
begin
  insert into public.daily_login_rewards(id,user_id,reward_date,credits)
  values('dl_'||replace(gen_random_uuid()::text,'-',''),p_user_id,today,reward)
  on conflict(user_id,reward_date) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    select balance into w from public.credit_wallets where user_id=p_user_id;
    return jsonb_build_object('awarded',false,'credits',0,'balance',coalesce(w.balance,0),'reason','already_claimed');
  end if;
  select * into w from public.add_credits(p_user_id,reward,'daily_login','daily_login',today::text,jsonb_build_object('rewardDate',today::text));
  return jsonb_build_object('awarded',true,'credits',reward,'balance',w.balance,'rewardDate',today::text);
end; $$;

create or replace function public.record_user_referral(p_invite_code text, p_email text, p_user_id uuid default null)
returns public.user_referrals language plpgsql security definer set search_path=public as $$
declare inviter public.users; r public.user_referrals;
begin
  select * into inviter from public.users where upper(invite_code)=upper(trim(p_invite_code)) limit 1;
  if not found then raise exception 'User referral code not found'; end if;
  if p_user_id is not null and inviter.id=p_user_id then raise exception 'Self referral is not allowed'; end if;
  insert into public.user_referrals(id,inviter_user_id,invitee_user_id,invitee_email,invite_code,status,inviter_reward,invitee_reward)
  values('ur_'||replace(gen_random_uuid()::text,'-',''),inviter.id,p_user_id,lower(trim(p_email)),upper(trim(p_invite_code)),case when p_user_id is null then 'pending' else 'completed' end,10,5)
  on conflict(invitee_email,invite_code) do update set invitee_user_id=coalesce(excluded.invitee_user_id,user_referrals.invitee_user_id),status=case when excluded.invitee_user_id is not null then 'completed' else user_referrals.status end
  returning * into r;
  return r;
end; $$;

create or replace function public.complete_user_referral(p_invitee_user_id uuid, p_email text, p_invite_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.user_referrals; inviter public.users; invitee public.users; rw public.credit_wallets;
begin
  select * into r from public.user_referrals where invitee_email=lower(trim(p_email)) and upper(invite_code)=upper(trim(p_invite_code)) and status='pending' for update;
  if not found then
    select * into r from public.user_referrals where invitee_user_id=p_invitee_user_id and status='completed' order by created_at desc limit 1;
    if found then return jsonb_build_object('awarded',false,'reason','already_completed'); end if;
    return jsonb_build_object('awarded',false,'reason','not_found');
  end if;
  if r.inviter_user_id=p_invitee_user_id then
    update public.user_referrals set status='rejected',completed_at=now() where id=r.id;
    return jsonb_build_object('awarded',false,'reason','self_referral');
  end if;
  select * into inviter from public.users where id=r.inviter_user_id;
  select * into invitee from public.users where id=p_invitee_user_id;
  if not found then return jsonb_build_object('awarded',false,'reason','invitee_not_found'); end if;
  perform public.add_credits(inviter.id,r.inviter_reward,'user_referral','friend_joined',r.id,jsonb_build_object('inviteCode',r.invite_code,'inviteeUserId',p_invitee_user_id));
  perform public.add_credits(invitee.id,r.invitee_reward,'user_referral','joined_from_friend',r.id,jsonb_build_object('inviteCode',r.invite_code,'inviterUserId',inviter.id));
  update public.user_referrals set invitee_user_id=p_invitee_user_id,status='completed',completed_at=now() where id=r.id;
  return jsonb_build_object('awarded',true,'inviterCredits',r.inviter_reward,'inviteeCredits',r.invitee_reward);
end; $$;

alter table public.user_referrals enable row level security;
alter table public.daily_login_rewards enable row level security;


-- Migration safety for existing installations: expand the credit transaction type check.
alter table public.credit_transactions drop constraint if exists credit_transactions_type_check;
alter table public.credit_transactions add constraint credit_transactions_type_check check (type in ('signup_bonus','purchase','spend','refund','admin_adjustment','daily_login','user_referral'));
