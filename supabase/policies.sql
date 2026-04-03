-- Partner Metrics App — Row Level Security Policies
-- Simplified v1: both household members can view each other's data

-- ─── Helper: get user's household IDs ───
create or replace function public.get_user_household_ids(uid uuid)
returns setof uuid as $$
  select household_id from public.household_members where user_id = uid;
$$ language sql security definer stable;

-- ═══════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

-- Users can read profiles of household members
create policy "Users can read household member profiles"
  on public.profiles for select
  using (
    id in (
      select hm.user_id from public.household_members hm
      where hm.household_id in (select public.get_user_household_ids(auth.uid()))
    )
  );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ═══════════════════════════════════════════
-- HOUSEHOLDS
-- ═══════════════════════════════════════════

-- Users can read their own households
create policy "Users can read own households"
  on public.households for select
  using (id in (select public.get_user_household_ids(auth.uid())));

-- Users can create households
create policy "Users can create households"
  on public.households for insert
  with check (created_by = auth.uid());

-- Owners can update their household
create policy "Owners can update household"
  on public.households for update
  using (
    id in (
      select hm.household_id from public.household_members hm
      where hm.user_id = auth.uid() and hm.role = 'owner'
    )
  );

-- ═══════════════════════════════════════════
-- HOUSEHOLD MEMBERS
-- ═══════════════════════════════════════════

-- Users can read members of their households
create policy "Users can read household members"
  on public.household_members for select
  using (household_id in (select public.get_user_household_ids(auth.uid())));

-- Users can insert themselves (for accepting invites)
create policy "Users can join household"
  on public.household_members for insert
  with check (user_id = auth.uid());

-- ═══════════════════════════════════════════
-- INVITATIONS
-- ═══════════════════════════════════════════

-- Household owners can create invitations
create policy "Owners can create invitations"
  on public.invitations for insert
  with check (
    household_id in (
      select hm.household_id from public.household_members hm
      where hm.user_id = auth.uid() and hm.role = 'owner'
    )
  );

-- Users can read invitations for their households
create policy "Users can read household invitations"
  on public.invitations for select
  using (household_id in (select public.get_user_household_ids(auth.uid())));

-- Anyone can read an invitation by token (for accepting)
create policy "Anyone can read invitation by token"
  on public.invitations for select
  using (true);

-- Invitation owner can update status
create policy "Invitation owner can update"
  on public.invitations for update
  using (
    household_id in (select public.get_user_household_ids(auth.uid()))
    or email = (select email from auth.users where id = auth.uid())
  );

-- ═══════════════════════════════════════════
-- METRIC DEFINITIONS
-- ═══════════════════════════════════════════

-- Users can read metrics for their household
create policy "Users can read household metrics"
  on public.metric_definitions for select
  using (household_id in (select public.get_user_household_ids(auth.uid())));

-- Users can create metrics for their household
create policy "Users can create metrics"
  on public.metric_definitions for insert
  with check (
    household_id in (select public.get_user_household_ids(auth.uid()))
    and created_by = auth.uid()
  );

-- Users can update metrics they created, or shared metrics
create policy "Users can update metrics"
  on public.metric_definitions for update
  using (
    household_id in (select public.get_user_household_ids(auth.uid()))
    and (created_by = auth.uid() or scope = 'shared')
  );

-- ═══════════════════════════════════════════
-- DAILY ENTRIES
-- ═══════════════════════════════════════════

-- Users can read entries in their household (v1: both members see everything)
create policy "Users can read household entries"
  on public.daily_entries for select
  using (household_id in (select public.get_user_household_ids(auth.uid())));

-- Users can only insert their own entries
create policy "Users can create own entries"
  on public.daily_entries for insert
  with check (user_id = auth.uid());

-- Users can only update their own entries
create policy "Users can update own entries"
  on public.daily_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own entries
create policy "Users can delete own entries"
  on public.daily_entries for delete
  using (user_id = auth.uid());

-- ═══════════════════════════════════════════
-- DAILY NOTES
-- ═══════════════════════════════════════════

-- Users can read notes in their household
create policy "Users can read household notes"
  on public.daily_notes for select
  using (household_id in (select public.get_user_household_ids(auth.uid())));

-- Users can only insert their own notes
create policy "Users can create own notes"
  on public.daily_notes for insert
  with check (user_id = auth.uid());

-- Users can only update their own notes
create policy "Users can update own notes"
  on public.daily_notes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
