// ─── Database row types (mirror Supabase schema) ───

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Household = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type Invitation = {
  id: string;
  household_id: string;
  email: string;
  token: string;
  invited_by: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
};

export type MetricInputType =
  | "boolean"
  | "count"
  | "duration_minutes"
  | "amount_decimal"
  | "rating_1_to_5"
  | "short_text";

export type MetricScope = "shared" | "personal";

export type TargetOperator = "gte" | "lte" | "eq";

export type MetricDefinition = {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  scope: MetricScope;
  owner_user_id: string | null;
  visible_to_partner: boolean;
  input_type: MetricInputType;
  unit: string | null;
  target_value: number | null;
  target_operator: TargetOperator | null;
  icon: string | null;
  color_token: string | null;
  sort_order: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DailyEntry = {
  id: string;
  household_id: string;
  metric_definition_id: string;
  user_id: string;
  entry_date: string;
  value_boolean: boolean | null;
  value_number: number | null;
  value_text: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyNote = {
  id: string;
  household_id: string;
  user_id: string;
  entry_date: string;
  note: string;
  created_at: string;
  updated_at: string;
};

// ─── Supabase Database type helper ───

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      households: {
        Row: Household;
        Insert: Omit<Household, "id" | "created_at">;
        Update: Partial<Omit<Household, "id" | "created_at">>;
      };
      household_members: {
        Row: HouseholdMember;
        Insert: Omit<HouseholdMember, "id" | "joined_at">;
        Update: Partial<Omit<HouseholdMember, "id">>;
      };
      invitations: {
        Row: Invitation;
        Insert: Omit<Invitation, "id" | "created_at">;
        Update: Partial<Omit<Invitation, "id" | "created_at">>;
      };
      metric_definitions: {
        Row: MetricDefinition;
        Insert: Omit<MetricDefinition, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<MetricDefinition, "id" | "created_at">>;
      };
      daily_entries: {
        Row: DailyEntry;
        Insert: Omit<DailyEntry, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DailyEntry, "id" | "created_at">>;
      };
      daily_notes: {
        Row: DailyNote;
        Insert: Omit<DailyNote, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DailyNote, "id" | "created_at">>;
      };
    };
  };
};
