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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      application_documents: {
        Row: {
          application_id: string
          file_name: string
          id: string
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_at: string
        }
        Insert: {
          application_id: string
          file_name: string
          id?: string
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string
        }
        Update: {
          application_id?: string
          file_name?: string
          id?: string
          storage_path?: string
          type?: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_periods: {
        Row: {
          closes_at: string
          id: string
          is_active: boolean
          name: string
          opens_at: string
        }
        Insert: {
          closes_at: string
          id?: string
          is_active?: boolean
          name: string
          opens_at: string
        }
        Update: {
          closes_at?: string
          id?: string
          is_active?: boolean
          name?: string
          opens_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          admin_remarks: string | null
          birthdate: string
          college_program: string
          consent_rejection_reason: string | null
          consent_status: Database["public"]["Enums"]["consent_status"]
          contact_number: string
          email: string
          emergency_contact: string
          emergency_name: string
          emergency_relationship: string
          first_name: string
          guardian_contact: string
          guardian_email: string
          guardian_name: string
          guardian_relationship: string
          home_address: string
          id: string
          last_name: string
          middle_name: string
          municipality: string
          original_consent_received: boolean
          period_id: string
          preferred_building: string | null
          privacy_accepted_at: string
          privacy_notice_version: string
          reviewed_at: string | null
          reviewed_by: string | null
          sex: string
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          submitted_at: string
          user_id: string
          year_level: string
        }
        Insert: {
          admin_remarks?: string | null
          birthdate: string
          college_program: string
          consent_rejection_reason?: string | null
          consent_status?: Database["public"]["Enums"]["consent_status"]
          contact_number: string
          email: string
          emergency_contact: string
          emergency_name: string
          emergency_relationship: string
          first_name: string
          guardian_contact: string
          guardian_email: string
          guardian_name: string
          guardian_relationship: string
          home_address: string
          id?: string
          last_name: string
          middle_name?: string
          municipality: string
          original_consent_received?: boolean
          period_id: string
          preferred_building?: string | null
          privacy_accepted_at: string
          privacy_notice_version: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sex: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          submitted_at?: string
          user_id: string
          year_level: string
        }
        Update: {
          admin_remarks?: string | null
          birthdate?: string
          college_program?: string
          consent_rejection_reason?: string | null
          consent_status?: Database["public"]["Enums"]["consent_status"]
          contact_number?: string
          email?: string
          emergency_contact?: string
          emergency_name?: string
          emergency_relationship?: string
          first_name?: string
          guardian_contact?: string
          guardian_email?: string
          guardian_name?: string
          guardian_relationship?: string
          home_address?: string
          id?: string
          last_name?: string
          middle_name?: string
          municipality?: string
          original_consent_received?: boolean
          period_id?: string
          preferred_building?: string | null
          privacy_accepted_at?: string
          privacy_notice_version?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sex?: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          submitted_at?: string
          user_id?: string
          year_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "application_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact_number: string
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          contact_number?: string
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          contact_number?: string
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_period_open: { Args: { _period_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "admin" | "staff"
      application_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "waitlisted"
        | "rejected"
      consent_status: "pending" | "received" | "verified" | "rejected"
      document_type: "load_slip" | "school_id" | "parental_consent"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "admin", "staff"],
      application_status: [
        "submitted",
        "under_review",
        "approved",
        "waitlisted",
        "rejected",
      ],
      consent_status: ["pending", "received", "verified", "rejected"],
      document_type: ["load_slip", "school_id", "parental_consent"],
    },
  },
} as const
