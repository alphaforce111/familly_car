import { createClient } from "@supabase/supabase-js";

export type CarReservation = {
  id: string;
  reservation_date: string;
  reserved_by: string;
  previous_reserved_by: string | null;
  takeover_reason: string | null;
  created_at: string;
  updated_at: string;
};

type CarReservationInsert = {
  id?: string;
  reservation_date: string;
  reserved_by: string;
  previous_reserved_by?: string | null;
  takeover_reason?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CarReservationUpdate = Partial<CarReservationInsert>;

type Database = {
  public: {
    Tables: {
      car_reservations: {
        Row: CarReservation;
        Insert: CarReservationInsert;
        Update: CarReservationUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient:
  | ReturnType<typeof createClient<Database>>
  | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(".env.local에 Supabase URL과 anon key를 설정해 주세요.");
  }

  if (
    supabaseUrl.includes("your-project-ref") ||
    supabaseAnonKey === "your-anon-key"
  ) {
    throw new Error(".env.local의 Supabase 예시값을 실제 프로젝트 값으로 바꿔 주세요.");
  }

  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.endsWith(".supabase.co")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL은 https://프로젝트ID.supabase.co 형식이어야 합니다.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}
