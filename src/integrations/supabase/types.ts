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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          target_audience: string
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          target_audience?: string
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          target_audience?: string
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campuses: {
        Row: {
          address: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      class_arms: {
        Row: {
          campus_id: string
          class_level_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          campus_id?: string
          class_level_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          campus_id?: string
          class_level_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_arms_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_arms_class_level_id_fkey"
            columns: ["class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      class_levels: {
        Row: {
          campus_id: string
          created_at: string
          display_order: number
          id: string
          name_ar: string | null
          name_en: string
        }
        Insert: {
          campus_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string | null
          name_en: string
        }
        Update: {
          campus_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string | null
          name_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_levels_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          id: string
          paid_date: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          due_date: string
          id?: string
          paid_date?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pins: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          pin: string
          student_id: string
          term_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          pin: string
          student_id: string
          term_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          pin?: string
          student_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          campus_id: string | null
          class_teacher_class_arm_id: string | null
          class_teacher_class_level_id: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          signature_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          campus_id?: string | null
          class_teacher_class_arm_id?: string | null
          class_teacher_class_level_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          signature_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          campus_id?: string | null
          class_teacher_class_arm_id?: string | null
          class_teacher_class_level_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          signature_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_class_teacher_class_arm_id_fkey"
            columns: ["class_teacher_class_arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_class_teacher_class_level_id_fkey"
            columns: ["class_teacher_class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_records: {
        Row: {
          created_at: string
          cumulative_average: number
          from_arm_id: string | null
          from_class_level_id: string
          id: string
          promoted_at: string
          promoted_by: string | null
          session_id: string
          status: string
          student_id: string
          to_arm_id: string | null
          to_class_level_id: string | null
        }
        Insert: {
          created_at?: string
          cumulative_average?: number
          from_arm_id?: string | null
          from_class_level_id: string
          id?: string
          promoted_at?: string
          promoted_by?: string | null
          session_id: string
          status: string
          student_id: string
          to_arm_id?: string | null
          to_class_level_id?: string | null
        }
        Update: {
          created_at?: string
          cumulative_average?: number
          from_arm_id?: string | null
          from_class_level_id?: string
          id?: string
          promoted_at?: string
          promoted_by?: string | null
          session_id?: string
          status?: string
          student_id?: string
          to_arm_id?: string | null
          to_class_level_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_records_from_arm_id_fkey"
            columns: ["from_arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_records_from_class_level_id_fkey"
            columns: ["from_class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_records_to_arm_id_fkey"
            columns: ["to_arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_records_to_class_level_id_fkey"
            columns: ["to_class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          archived_at: string | null
          campus_id: string
          class_arm_id: string | null
          class_id: string | null
          class_level_id: string | null
          created_at: string
          date_of_birth: string | null
          enrollment_date: string
          email: string | null
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          name_ar: string | null
          name_en: string | null
          notes: string | null
          parent_id: string | null
          status: string
          student_uid: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          campus_id?: string
          class_arm_id?: string | null
          class_id?: string | null
          class_level_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string
          email?: string | null
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          name_ar?: string | null
          name_en?: string | null
          notes?: string | null
          parent_id?: string | null
          status?: string
          student_uid?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          campus_id?: string
          class_arm_id?: string | null
          class_id?: string | null
          class_level_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          name_ar?: string | null
          name_en?: string | null
          notes?: string | null
          parent_id?: string | null
          status?: string
          student_uid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_arm_id_fkey"
            columns: ["class_arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_level_id_fkey"
            columns: ["class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_level_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          name_ar: string | null
        }
        Insert: {
          class_level_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_ar?: string | null
        }
        Update: {
          class_level_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_level_id_fkey"
            columns: ["class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      term_scores: {
        Row: {
          ca1: number
          ca2: number
          created_at: string
          exam: number
          grade: string | null
          id: string
          student_id: string
          subject_id: string
          term_id: string
          total: number | null
          updated_at: string
        }
        Insert: {
          ca1?: number
          ca2?: number
          created_at?: string
          exam?: number
          grade?: string | null
          id?: string
          student_id: string
          subject_id: string
          term_id: string
          total?: number | null
          updated_at?: string
        }
        Update: {
          ca1?: number
          ca2?: number
          created_at?: string
          exam?: number
          grade?: string | null
          id?: string
          student_id?: string
          subject_id?: string
          term_id?: string
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_scores_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_scores_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          id: string
          is_locked: boolean
          name_ar: string | null
          name_en: string
          session_id: string
          term_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_locked?: boolean
          name_ar?: string | null
          name_en: string
          session_id: string
          term_number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_locked?: boolean
          name_ar?: string | null
          name_en?: string
          session_id?: string
          term_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "terms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tiered_remarks: {
        Row: {
          class_arm_id: string | null
          created_at: string
          id: string
          max_score: number
          min_score: number
          remark_ar: string
          remark_en: string
          role: string
          updated_at: string
        }
        Insert: {
          class_arm_id?: string | null
          created_at?: string
          id?: string
          max_score: number
          min_score: number
          remark_ar?: string
          remark_en?: string
          role: string
          updated_at?: string
        }
        Update: {
          class_arm_id?: string | null
          created_at?: string
          id?: string
          max_score?: number
          min_score?: number
          remark_ar?: string
          remark_en?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiered_remarks_class_arm_id_fkey"
            columns: ["class_arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
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
      can_access_campus: { Args: { _campus_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      main_campus_id: { Args: never; Returns: string }
      user_campus_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent"
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
      app_role: ["admin", "teacher", "parent"],
    },
  },
} as const
