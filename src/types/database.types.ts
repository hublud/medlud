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
      admin_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          severity: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          severity?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_serious: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_serious?: boolean | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_serious?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_history: {
        Row: {
          appointment_id: string | null
          change_note: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_staff_id: string | null
          new_status: string | null
          old_staff_id: string | null
          old_status: string | null
        }
        Insert: {
          appointment_id?: string | null
          change_note?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_staff_id?: string | null
          new_status?: string | null
          old_staff_id?: string | null
          old_status?: string | null
        }
        Update: {
          appointment_id?: string | null
          change_note?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_staff_id?: string | null
          new_status?: string | null
          old_staff_id?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_history_new_staff_id_fkey"
            columns: ["new_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_history_old_staff_id_fkey"
            columns: ["old_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          ai_summary: Json | null
          category: string | null
          created_at: string | null
          date: string | null
          doctor_id: string | null
          doctor_response: string | null
          duration: string | null
          id: string
          medication_details: string | null
          notes: string | null
          priority: string | null
          severity: string | null
          staff_id: string | null
          status: string | null
          symptoms: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_summary?: Json | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          doctor_id?: string | null
          doctor_response?: string | null
          duration?: string | null
          id?: string
          medication_details?: string | null
          notes?: string | null
          priority?: string | null
          severity?: string | null
          staff_id?: string | null
          status?: string | null
          symptoms?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_summary?: Json | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          doctor_id?: string | null
          doctor_response?: string | null
          duration?: string | null
          id?: string
          medication_details?: string | null
          notes?: string | null
          priority?: string | null
          severity?: string | null
          staff_id?: string | null
          status?: string | null
          symptoms?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_records: {
        Row: {
          commission_amount: number
          consultation_id: string | null
          created_at: string | null
          doctor_amount: number
          id: string
          payout_id: string | null
          payout_status: string | null
          total_amount: number
        }
        Insert: {
          commission_amount: number
          consultation_id?: string | null
          created_at?: string | null
          doctor_amount: number
          id?: string
          payout_id?: string | null
          payout_status?: string | null
          total_amount: number
        }
        Update: {
          commission_amount?: number
          consultation_id?: string | null
          created_at?: string | null
          doctor_amount?: number
          id?: string
          payout_id?: string | null
          payout_status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "doctor_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          commission_amount: number
          consultation_type: string | null
          created_at: string | null
          doctor_amount: number
          doctor_id: string | null
          ended_at: string | null
          id: string
          price: number
          specialist_flag: boolean | null
          specialty_type: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_amount: number
          consultation_type?: string | null
          created_at?: string | null
          doctor_amount: number
          doctor_id?: string | null
          ended_at?: string | null
          id?: string
          price: number
          specialist_flag?: boolean | null
          specialty_type?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_amount?: number
          consultation_type?: string | null
          created_at?: string | null
          doctor_amount?: number
          doctor_id?: string | null
          ended_at?: string | null
          id?: string
          price?: number
          specialist_flag?: boolean | null
          specialty_type?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coping_techniques: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string
          display_order: number | null
          duration: string
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description: string
          display_order?: number | null
          duration: string
          id?: string
          is_active?: boolean | null
          name: string
          steps: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          display_order?: number | null
          duration?: string
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      critical_cases: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          flagged_reason: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          flagged_reason: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          flagged_reason?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "critical_cases_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "critical_cases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_payouts: {
        Row: {
          amount: number
          created_at: string | null
          doctor_id: string | null
          id: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_payouts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_specialist: boolean | null
          pending_balance: number | null
          specialist_price_chat: number | null
          specialist_price_video: number | null
          specialization: string | null
          specialty_type: string | null
          updated_at: string | null
          withdrawable_balance: number | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id: string
          is_specialist?: boolean | null
          pending_balance?: number | null
          specialist_price_chat?: number | null
          specialist_price_video?: number | null
          specialization?: string | null
          specialty_type?: string | null
          updated_at?: string | null
          withdrawable_balance?: number | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_specialist?: boolean | null
          pending_balance?: number | null
          specialist_price_chat?: number | null
          specialist_price_video?: number | null
          specialization?: string | null
          specialty_type?: string | null
          updated_at?: string | null
          withdrawable_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_schedules: {
        Row: {
          case_id: string | null
          created_at: string | null
          doctor_id: string | null
          id: string
          patient_id: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_schedules_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "telemedicine_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_schedules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_tips: {
        Row: {
          bg_color: string
          created_at: string | null
          description: string
          icon_name: string
          id: string
          text_color: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string
          created_at?: string | null
          description: string
          icon_name?: string
          id?: string
          text_color?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string
          created_at?: string | null
          description?: string
          icon_name?: string
          id?: string
          text_color?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mental_health_organizations: {
        Row: {
          category: string | null
          contact: string
          created_at: string | null
          created_by: string | null
          description: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          contact: string
          created_at?: string | null
          created_by?: string | null
          description: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          contact?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          appointment_id: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          role: Database["public"]["Enums"]["message_role"]
          sender_id: string | null
        }
        Insert: {
          appointment_id: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          role: Database["public"]["Enums"]["message_role"]
          sender_id?: string | null
        }
        Update: {
          appointment_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          role?: Database["public"]["Enums"]["message_role"]
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          chat_message_limit: number
          chat_price: number
          chat_session_duration_minutes: number
          commission_percentage: number
          created_at: string | null
          id: string
          specialist_chat_price: number | null
          specialist_video_price: number | null
          updated_at: string | null
          video_price: number
          voice_price: number
          specialist_voice_price: number | null
          video_session_duration_minutes: number
        }
        Insert: {
          chat_message_limit?: number
          chat_price?: number
          chat_session_duration_minutes?: number
          commission_percentage?: number
          created_at?: string | null
          id?: string
          specialist_chat_price?: number | null
          specialist_video_price?: number | null
          updated_at?: string | null
          video_price?: number
          voice_price?: number
          specialist_voice_price?: number | null
          video_session_duration_minutes?: number
        }
        Update: {
          chat_message_limit?: number
          chat_price?: number
          chat_session_duration_minutes?: number
          commission_percentage?: number
          created_at?: string | null
          id?: string
          specialist_chat_price?: number | null
          specialist_video_price?: number | null
          updated_at?: string | null
          video_price?: number
          voice_price?: number
          specialist_voice_price?: number | null
          video_session_duration_minutes?: number
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          appointment_id: string
          created_at: string | null
          dosage: string
          duration: string
          frequency: string
          id: string
          medication: string
          notes: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          dosage: string
          duration: string
          frequency: string
          id?: string
          medication: string
          notes?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          medication?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_role: string | null
          ai_consent_accepted: boolean | null
          allergies: string | null
          blood_group: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_consent_accepted: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_pregnant: boolean | null
          is_staff_verified: boolean | null
          known_conditions: string | null
          med_id: string | null
          notify_appointments: boolean | null
          notify_emergency: boolean | null
          notify_health_tips: boolean | null
          notify_telemedicine: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: string | null
          phone: string | null
          privacy_policy_accepted: boolean | null
          role: string | null
          share_location_emergency: boolean | null
          state: string | null
          terms_accepted: boolean | null
          updated_at: string | null
          wallet_balance: number | null
        }
        Insert: {
          admin_role?: string | null
          ai_consent_accepted?: boolean | null
          allergies?: string | null
          blood_group?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_consent_accepted?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_pregnant?: boolean | null
          is_staff_verified?: boolean | null
          known_conditions?: string | null
          med_id?: string | null
          notify_appointments?: boolean | null
          notify_emergency?: boolean | null
          notify_health_tips?: boolean | null
          notify_telemedicine?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          phone?: string | null
          privacy_policy_accepted?: boolean | null
          role?: string | null
          share_location_emergency?: boolean | null
          state?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          wallet_balance?: number | null
        }
        Update: {
          admin_role?: string | null
          ai_consent_accepted?: boolean | null
          allergies?: string | null
          blood_group?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_consent_accepted?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_pregnant?: boolean | null
          is_staff_verified?: boolean | null
          known_conditions?: string | null
          med_id?: string | null
          notify_appointments?: boolean | null
          notify_emergency?: boolean | null
          notify_health_tips?: boolean | null
          notify_telemedicine?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          phone?: string | null
          privacy_policy_accepted?: boolean | null
          role?: string | null
          share_location_emergency?: boolean | null
          state?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      self_care_tips: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          tip: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          tip: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          tip?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      session_messages: {
        Row: {
          consultation_id: string | null
          content: string
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          consultation_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          consultation_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_availability: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_available: boolean | null
          staff_id: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_available?: boolean | null
          staff_id?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          staff_id?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_ratings: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          feedback: string | null
          id: string
          patient_id: string | null
          rating: number | null
          staff_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          patient_id?: string | null
          rating?: number | null
          staff_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          patient_id?: string | null
          rating?: number | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_ratings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicine_calls: {
        Row: {
          ai_summary: string | null
          call_type: string
          case_id: string | null
          channel_name: string
          created_at: string | null
          diagnosis_notes: string | null
          doctor_summary: string | null
          duration: number | null
          id: string
          lab_request_url: string | null
          lab_test_required: boolean | null
          patient_id: string
          provider_id: string | null
          provider_notes: string | null
          required_lab_tests: string | null
          status: string
          token: string | null
          transcript: string | null
          treatment_instructions: string | null
          updated_at: string | null
          uploaded_lab_results_url: string | null
        }
        Insert: {
          ai_summary?: string | null
          call_type: string
          case_id?: string | null
          channel_name: string
          created_at?: string | null
          diagnosis_notes?: string | null
          doctor_summary?: string | null
          duration?: number | null
          id?: string
          lab_request_url?: string | null
          lab_test_required?: boolean | null
          patient_id: string
          provider_id?: string | null
          provider_notes?: string | null
          required_lab_tests?: string | null
          status?: string
          token?: string | null
          transcript?: string | null
          treatment_instructions?: string | null
          updated_at?: string | null
          uploaded_lab_results_url?: string | null
        }
        Update: {
          ai_summary?: string | null
          call_type?: string
          case_id?: string | null
          channel_name?: string
          created_at?: string | null
          diagnosis_notes?: string | null
          doctor_summary?: string | null
          duration?: number | null
          id?: string
          lab_request_url?: string | null
          lab_test_required?: boolean | null
          patient_id?: string
          provider_id?: string | null
          provider_notes?: string | null
          required_lab_tests?: string | null
          status?: string
          token?: string | null
          transcript?: string | null
          treatment_instructions?: string | null
          updated_at?: string | null
          uploaded_lab_results_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_calls_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "telemedicine_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicine_cases: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          description: string | null
          doctor_id: string | null
          id: string
          patient_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_cases_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          action: string
          created_at: string | null
          feature: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          feature?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          feature?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reference_id: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string | null
          doctor_id: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_ai_message_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      increment_wallet_balance: {
        Args: { amount_to_add: number; user_uuid: string }
        Returns: number
      }
      insert_ai_chat_message: {
        Args: { p_content: string; p_role: string; p_user_id: string }
        Returns: undefined
      }
      is_admin_or_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      message_role: "DOCTOR" | "USER" | "AI"
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
      message_role: ["DOCTOR", "USER", "AI"],
    },
  },
} as const
