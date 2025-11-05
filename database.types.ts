export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert: {
        Row: {
          alert_level: string | null
          content: string | null
          created_at: string
          deleted_at: string | null
          id: number
          title: string | null
        }
        Insert: {
          alert_level?: string | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          title?: string | null
        }
        Update: {
          alert_level?: string | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          title?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          post: number | null
          user: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          post?: number | null
          user?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          post?: number | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_fkey"
            columns: ["post"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      evacuation_centers: {
        Row: {
          address: string
          capacity: number | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          current_occupancy: number | null
          id: number
          latitude: number
          longitude: number
          name: string
          photos: string[] | null
          status: Database["public"]["Enums"]["evacuation_status"] | null
          updated_at: string | null
        }
        Insert: {
          address: string
          capacity?: number | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          current_occupancy?: number | null
          id?: number
          latitude: number
          longitude: number
          name: string
          photos?: string[] | null
          status?: Database["public"]["Enums"]["evacuation_status"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          capacity?: number | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          current_occupancy?: number | null
          id?: number
          latitude?: number
          longitude?: number
          name?: string
          photos?: string[] | null
          status?: Database["public"]["Enums"]["evacuation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evacuation_centers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: number
          receiver: string
          seen_at: string | null
          sender: string
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: number
          receiver: string
          seen_at?: string | null
          sender: string
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: number
          receiver?: string
          seen_at?: string | null
          sender?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_fkey"
            columns: ["receiver"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_fkey"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          code: string
          created_at: string | null
          email: string | null
          expires_at: string
          id: number
          phone: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: number
          phone: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: number
          phone?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: number
          media_url: string | null
          shared_post: number | null
          updated_at: string | null
          user: string
          visibility: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          media_url?: string | null
          shared_post?: number | null
          updated_at?: string | null
          user: string
          visibility?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          media_url?: string | null
          shared_post?: number | null
          updated_at?: string | null
          user?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_shared_post_fkey"
            columns: ["shared_post"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rescues: {
        Row: {
          attachments: string[] | null
          completed_at: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          email: string | null
          emergency_type: string | null
          female_count: number | null
          id: string
          important_information: string | null
          lat: number | null
          lng: number | null
          male_count: number | null
          metadata: Json | null
          priority: number
          reported_at: string
          scheduled_for: string | null
          status: Database["public"]["Enums"]["rescue_status"]
          title: string
          updated_at: string
          user: string | null
        }
        Insert: {
          attachments?: string[] | null
          completed_at?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          emergency_type?: string | null
          female_count?: number | null
          id?: string
          important_information?: string | null
          lat?: number | null
          lng?: number | null
          male_count?: number | null
          metadata?: Json | null
          priority?: number
          reported_at?: string
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["rescue_status"]
          title: string
          updated_at?: string
          user?: string | null
        }
        Update: {
          attachments?: string[] | null
          completed_at?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          emergency_type?: string | null
          female_count?: number | null
          id?: string
          important_information?: string | null
          lat?: number | null
          lng?: number | null
          male_count?: number | null
          metadata?: Json | null
          priority?: number
          reported_at?: string
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["rescue_status"]
          title?: string
          updated_at?: string
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rescues_user_fkey1"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          content: string
          created_at: string
          id: number
          sender: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          sender?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          sender?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_sender_fkey"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          birth_date: string | null
          created_at: string
          device_token: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          id_picture: string | null
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          profile_picture: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          device_token?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id: string
          id_picture?: string | null
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          profile_picture?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          device_token?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          id_picture?: string | null
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          profile_picture?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      evacuation_status: "open" | "closed" | "full" | "maintenance"
      rescue_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      evacuation_status: ["open", "closed", "full", "maintenance"],
      rescue_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["admin", "user"],
    },
  },
} as const
