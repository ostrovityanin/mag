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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          category_id: string | null
          cost_usd: number | null
          created_at: string
          full_prompt_sent: string | null
          id: string
          message_text: string
          response_text: string | null
          system_prompt: string | null
          telegram_user_id: number
          tokens_used: number | null
        }
        Insert: {
          category_id?: string | null
          cost_usd?: number | null
          created_at?: string
          full_prompt_sent?: string | null
          id?: string
          message_text: string
          response_text?: string | null
          system_prompt?: string | null
          telegram_user_id: number
          tokens_used?: number | null
        }
        Update: {
          category_id?: string | null
          cost_usd?: number | null
          created_at?: string
          full_prompt_sent?: string | null
          id?: string
          message_text?: string
          response_text?: string | null
          system_prompt?: string | null
          telegram_user_id?: number
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_token_usage: {
        Row: {
          id: string
          telegram_user_id: number
          tokens_used: number | null
          usage_date: string
        }
        Insert: {
          id?: string
          telegram_user_id: number
          tokens_used?: number | null
          usage_date?: string
        }
        Update: {
          id?: string
          telegram_user_id?: number
          tokens_used?: number | null
          usage_date?: string
        }
        Relationships: []
      }
      daw_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      daw_channels: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
        }
        Relationships: []
      }
      daw_conversations: {
        Row: {
          category_id: string | null
          cost_usd: number | null
          created_at: string
          full_prompt_sent: string | null
          id: string
          input_tokens: number | null
          message_text: string
          model_used: string | null
          output_tokens: number | null
          response_text: string | null
          system_prompt: string | null
          telegram_user_id: number
          tokens_used: number | null
        }
        Insert: {
          category_id?: string | null
          cost_usd?: number | null
          created_at?: string
          full_prompt_sent?: string | null
          id?: string
          input_tokens?: number | null
          message_text: string
          model_used?: string | null
          output_tokens?: number | null
          response_text?: string | null
          system_prompt?: string | null
          telegram_user_id: number
          tokens_used?: number | null
        }
        Update: {
          category_id?: string | null
          cost_usd?: number | null
          created_at?: string
          full_prompt_sent?: string | null
          id?: string
          input_tokens?: number | null
          message_text?: string
          model_used?: string | null
          output_tokens?: number | null
          response_text?: string | null
          system_prompt?: string | null
          telegram_user_id?: number
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daw_conversations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "daw_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      daw_daily_token_usage: {
        Row: {
          id: string
          telegram_user_id: number
          tokens_used: number | null
          usage_date: string
        }
        Insert: {
          id?: string
          telegram_user_id: number
          tokens_used?: number | null
          usage_date?: string
        }
        Update: {
          id?: string
          telegram_user_id?: number
          tokens_used?: number | null
          usage_date?: string
        }
        Relationships: []
      }
      daw_hourly_reminder_settings: {
        Row: {
          created_at: string
          hour_of_day: number
          id: string
          is_enabled: boolean
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hour_of_day: number
          id?: string
          is_enabled?: boolean
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hour_of_day?: number
          id?: string
          is_enabled?: boolean
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      daw_model_pricing: {
        Row: {
          created_at: string | null
          id: string
          input_price_per_1k: number
          is_active: boolean | null
          model_name: string
          output_price_per_1k: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_price_per_1k: number
          is_active?: boolean | null
          model_name: string
          output_price_per_1k: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          input_price_per_1k?: number
          is_active?: boolean | null
          model_name?: string
          output_price_per_1k?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      daw_prompts: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daw_reminder_queue: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          max_attempts: number
          scheduled_time: string
          sent_at: string | null
          status: string
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          scheduled_time: string
          sent_at?: string | null
          status?: string
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          scheduled_time?: string
          sent_at?: string | null
          status?: string
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      daw_reminder_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          reminder_time: string
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          reminder_time?: string
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          reminder_time?: string
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      daw_telegram_users: {
        Row: {
          created_at: string
          daily_tokens_limit: number | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          telegram_user_id: number
          total_tokens_limit: number | null
          total_tokens_used: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          daily_tokens_limit?: number | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          telegram_user_id: number
          total_tokens_limit?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          daily_tokens_limit?: number | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          telegram_user_id?: number
          total_tokens_limit?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      daw_user_context: {
        Row: {
          created_at: string
          desires: string | null
          goals: string | null
          id: string
          preferences: Json | null
          structured_goals: Json | null
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          desires?: string | null
          goals?: string | null
          id?: string
          preferences?: Json | null
          structured_goals?: Json | null
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          desires?: string | null
          goals?: string | null
          id?: string
          preferences?: Json | null
          structured_goals?: Json | null
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      daw_weekly_goals: {
        Row: {
          created_at: string
          goal_text: string
          id: string
          is_active: boolean | null
          telegram_user_id: number
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          goal_text: string
          id?: string
          is_active?: boolean | null
          telegram_user_id: number
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          goal_text?: string
          id?: string
          is_active?: boolean | null
          telegram_user_id?: number
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string
          daily_tokens_limit: number | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          telegram_user_id: number
          total_tokens_limit: number | null
          total_tokens_used: number | null
          username: string | null
        }
        Insert: {
          created_at?: string
          daily_tokens_limit?: number | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          telegram_user_id: number
          total_tokens_limit?: number | null
          total_tokens_used?: number | null
          username?: string | null
        }
        Update: {
          created_at?: string
          daily_tokens_limit?: number | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          telegram_user_id?: number
          total_tokens_limit?: number | null
          total_tokens_used?: number | null
          username?: string | null
        }
        Relationships: []
      }
      user_context: {
        Row: {
          created_at: string
          desires: string | null
          goals: string | null
          id: string
          preferences: Json | null
          structured_goals: Json | null
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          desires?: string | null
          goals?: string | null
          id?: string
          preferences?: Json | null
          structured_goals?: Json | null
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          desires?: string | null
          goals?: string | null
          id?: string
          preferences?: Json | null
          structured_goals?: Json | null
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      daw_cost_analytics: {
        Row: {
          avg_cost_per_request: number | null
          date: string | null
          first_name: string | null
          last_name: string | null
          model_used: string | null
          requests_count: number | null
          telegram_user_id: number | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_token_limits: {
        Args: { user_id: number; tokens_needed: number }
        Returns: Json
      }
      create_default_hourly_reminders: {
        Args: { user_id: number }
        Returns: undefined
      }
      daw_check_token_limits: {
        Args: { user_id: number; tokens_needed: number }
        Returns: Json
      }
      daw_update_token_usage: {
        Args: { user_id: number; tokens_used: number }
        Returns: undefined
      }
      exec_sql: {
        Args: { query: string }
        Returns: {
          result: Json
        }[]
      }
      recalculate_conversation_costs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_next_day_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_today_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_token_usage: {
        Args: { user_id: number; tokens_used: number }
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
