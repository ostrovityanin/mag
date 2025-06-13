export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          created_at: string
          details: Json
          error_message: string | null
          execution_time_ms: number | null
          filtered_count: number | null
          id: string
          ip_address: string | null
          log_type: string
          operation: string
          request_url: string | null
          session_info: Json | null
          success: boolean | null
          telegram_user_id: number | null
          user_agent: string | null
          user_count: number | null
        }
        Insert: {
          created_at?: string
          details?: Json
          error_message?: string | null
          execution_time_ms?: number | null
          filtered_count?: number | null
          id?: string
          ip_address?: string | null
          log_type: string
          operation: string
          request_url?: string | null
          session_info?: Json | null
          success?: boolean | null
          telegram_user_id?: number | null
          user_agent?: string | null
          user_count?: number | null
        }
        Update: {
          created_at?: string
          details?: Json
          error_message?: string | null
          execution_time_ms?: number | null
          filtered_count?: number | null
          id?: string
          ip_address?: string | null
          log_type?: string
          operation?: string
          request_url?: string | null
          session_info?: Json | null
          success?: boolean | null
          telegram_user_id?: number | null
          user_agent?: string | null
          user_count?: number | null
        }
        Relationships: []
      }
      app_channels: {
        Row: {
          app: string
          channel_id: string | null
          created_at: string
          id: string
          required: boolean
        }
        Insert: {
          app: string
          channel_id?: string | null
          created_at?: string
          id?: string
          required?: boolean
        }
        Update: {
          app?: string
          channel_id?: string | null
          created_at?: string
          id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "app_channels_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          invite_link: string | null
          name: string
          username: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          invite_link?: string | null
          name: string
          username: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          invite_link?: string | null
          name?: string
          username?: string
        }
        Relationships: []
      }
      fortune_requests: {
        Row: {
          created_at: string
          id: string
          request_date: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          request_date?: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          request_date?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fortune_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      horoscope_requests: {
        Row: {
          created_at: string
          id: string
          request_date: string
          response: string | null
          user_id: string | null
          zodiac_sign: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_date?: string
          response?: string | null
          user_id?: string | null
          zodiac_sign: string
        }
        Update: {
          created_at?: string
          id?: string
          request_date?: string
          response?: string | null
          user_id?: string | null
          zodiac_sign?: string
        }
        Relationships: [
          {
            foreignKeyName: "horoscope_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      required_channels: {
        Row: {
          app_name: string
          channel_type: string
          chat_id: string | null
          created_at: string
          id: string
          invite_link: string | null
          name: string
          required: boolean
          username: string
        }
        Insert: {
          app_name?: string
          channel_type?: string
          chat_id?: string | null
          created_at?: string
          id?: string
          invite_link?: string | null
          name: string
          required?: boolean
          username: string
        }
        Update: {
          app_name?: string
          channel_type?: string
          chat_id?: string | null
          created_at?: string
          id?: string
          invite_link?: string | null
          name?: string
          required?: boolean
          username?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          blocked_action: string | null
          context: Json | null
          created_at: string
          description: string
          event_type: string
          id: string
          severity: string
          telegram_user_id: number | null
        }
        Insert: {
          blocked_action?: string | null
          context?: Json | null
          created_at?: string
          description: string
          event_type: string
          id?: string
          severity?: string
          telegram_user_id?: number | null
        }
        Update: {
          blocked_action?: string | null
          context?: Json | null
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          severity?: string
          telegram_user_id?: number | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          context: Json | null
          created_at: string
          function_name: string | null
          id: string
          level: string
          message: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          function_name?: string | null
          id?: string
          level?: string
          message: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          function_name?: string | null
          id?: string
          level?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_bot: boolean | null
          is_premium: boolean | null
          language_code: string | null
          last_login: string | null
          last_name: string | null
          photo_url: string | null
          telegram_id: number
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_bot?: boolean | null
          is_premium?: boolean | null
          language_code?: string | null
          last_login?: string | null
          last_name?: string | null
          photo_url?: string | null
          telegram_id: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_bot?: boolean | null
          is_premium?: boolean | null
          language_code?: string | null
          last_login?: string | null
          last_name?: string | null
          photo_url?: string | null
          telegram_id?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          channel_id: string
          checked_at: string | null
          created_at: string
          id: string
          is_subscribed: boolean | null
          user_id: string | null
        }
        Insert: {
          channel_id: string
          checked_at?: string | null
          created_at?: string
          id?: string
          is_subscribed?: boolean | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string
          checked_at?: string | null
          created_at?: string
          id?: string
          is_subscribed?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_premium: boolean | null
          language_code: string | null
          last_name: string | null
          telegram_id: number
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean | null
          language_code?: string | null
          last_name?: string | null
          telegram_id: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean | null
          language_code?: string | null
          last_name?: string | null
          telegram_id?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
