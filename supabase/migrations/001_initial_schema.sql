-- Partner Metrics App — Initial Schema
-- Run this migration against your Supabase project

-- ─── Profiles ───
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Households ───
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ─── Household Members ───
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- ─── Invitations ───
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  token text not null unique,
  invited_by uuid not null references public.profiles(id),
  status text not null check (status in ('pending', 'accepted', 'expired', 'revoked')) default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ─── Metric Definitions ───
create table if not exists public.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  description text,
  scope text not null check (scope in ('shared', 'personal')),
  owner_user_id uuid references public.profiles(id),
  visible_to_partner boolean not null default true,
  input_type text not null check (input_type in ('boolean', 'count', 'duration_minutes', 'amount_decimal', 'rating_1_to_5', 'short_text')),
  unit text,
  target_value numeric,
  target_operator text check (target_operator in ('gte', 'lte', 'eq')),
  icon text,
  color_token text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Scope constraints via check
  constraint scope_owner_check check (
    (scope = 'shared' and owner_user_id is null) or
    (scope = 'personal' and owner_user_id is not null)
  )
);

-- ─── Daily Entries ───
create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  metric_definition_id uuid not null references public.metric_definitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  value_boolean boolean,
  value_number numeric,
  value_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_definition_id, user_id, entry_date)
);

-- ─── Daily Notes ───
create table if not exists public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

-- ─── Indexes ───
create index if not exists idx_household_members_user on public.household_members(user_id);
create index if not exists idx_household_members_household on public.household_members(household_id);
create index if not exists idx_metric_definitions_household on public.metric_definitions(household_id);
create index if not exists idx_daily_entries_user_date on public.daily_entries(user_id, entry_date);
create index if not exists idx_daily_entries_metric_date on public.daily_entries(metric_definition_id, entry_date);
create index if not exists idx_daily_notes_user_date on public.daily_notes(user_id, entry_date);
create index if not exists idx_invitations_token on public.invitations(token);
create index if not exists idx_invitations_email on public.invitations(email);

-- ─── Updated_at trigger ───
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.metric_definitions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.daily_entries
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.daily_notes
  for each row execute function public.handle_updated_at();

-- ─── Auto-create profile on auth signup ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invitations enable row level security;
alter table public.metric_definitions enable row level security;
alter table public.daily_entries enable row level security;
alter table public.daily_notes enable row level security;
