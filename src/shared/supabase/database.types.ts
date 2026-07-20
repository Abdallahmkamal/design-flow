export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_event_types: {
        Row: {
          code: string
        }
        Insert: {
          code: string
        }
        Update: {
          code?: string
        }
        Relationships: []
      }
      admin_audit_events: {
        Row: {
          actor_id: string | null
          event_type_code: string
          id: string
          new_values: Json | null
          occurred_at: string
          operation_id: string
          previous_values: Json | null
          subject_id: string | null
          subject_type: string
        }
        Insert: {
          actor_id?: string | null
          event_type_code: string
          id?: string
          new_values?: Json | null
          occurred_at?: string
          operation_id: string
          previous_values?: Json | null
          subject_id?: string | null
          subject_type: string
        }
        Update: {
          actor_id?: string | null
          event_type_code?: string
          id?: string
          new_values?: Json | null
          occurred_at?: string
          operation_id?: string
          previous_values?: Json | null
          subject_id?: string | null
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_events_event_type_code_fkey"
            columns: ["event_type_code"]
            isOneToOne: false
            referencedRelation: "admin_audit_event_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "admin_audit_events_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      blockers: {
        Row: {
          blocked_at: string
          blocked_by: string
          create_operation_id: string
          expected_resolution_date: string | null
          id: string
          reason: string
          resolution_note: string | null
          resolve_operation_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          work_item_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by: string
          create_operation_id: string
          expected_resolution_date?: string | null
          id?: string
          reason: string
          resolution_note?: string | null
          resolve_operation_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          work_item_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string
          create_operation_id?: string
          expected_resolution_date?: string | null
          id?: string
          reason?: string
          resolution_note?: string | null
          resolve_operation_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockers_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_create_operation_id_fkey"
            columns: ["create_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_resolve_operation_id_fkey"
            columns: ["resolve_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bootstrap_state: {
        Row: {
          consumed_at: string | null
          first_admin_profile_id: string | null
          operation_id: string | null
          singleton_key: boolean
        }
        Insert: {
          consumed_at?: string | null
          first_admin_profile_id?: string | null
          operation_id?: string | null
          singleton_key?: boolean
        }
        Update: {
          consumed_at?: string | null
          first_admin_profile_id?: string | null
          operation_id?: string | null
          singleton_key?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bootstrap_state_first_admin_profile_id_fkey"
            columns: ["first_admin_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bootstrap_state_first_admin_profile_id_fkey"
            columns: ["first_admin_profile_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bootstrap_state_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_revisions: {
        Row: {
          change_kind: string
          changed_at: string
          changed_by: string
          comment_id: string
          id: string
          new_body: string | null
          operation_id: string
          previous_body: string
          revision_number: number
        }
        Insert: {
          change_kind: string
          changed_at?: string
          changed_by: string
          comment_id: string
          id?: string
          new_body?: string | null
          operation_id: string
          previous_body: string
          revision_number: number
        }
        Update: {
          change_kind?: string
          changed_at?: string
          changed_by?: string
          comment_id?: string
          id?: string
          new_body?: string | null
          operation_id?: string
          previous_body?: string
          revision_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_revisions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_revisions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "visible_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_revisions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          edited_at: string | null
          id: string
          withdrawn_at: string | null
          withdrawn_by: string | null
          work_item_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          sort_order: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labels_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labels_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labels_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_type_definitions: {
        Row: {
          code: string
        }
        Insert: {
          code: string
        }
        Update: {
          code?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          notification_type_code: string
          read_at: string | null
          recipient_id: string
          source_event_id: string
          work_item_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          notification_type_code: string
          read_at?: string | null
          recipient_id: string
          source_event_id: string
          work_item_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          notification_type_code?: string
          read_at?: string | null
          recipient_id?: string
          source_event_id?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_notification_type_code_fkey"
            columns: ["notification_type_code"]
            isOneToOne: false
            referencedRelation: "notification_type_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "work_item_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_requests: {
        Row: {
          actor_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          operation_code: string
          request_hash: string
          result: Json | null
          state: string
          updated_at: string
        }
        Insert: {
          actor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id: string
          operation_code: string
          request_hash: string
          result?: Json | null
          state: string
          updated_at?: string
        }
        Update: {
          actor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          operation_code?: string
          request_hash?: string
          result?: Json | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_requests_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_requests_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      position_definitions: {
        Row: {
          admin_eligible: boolean
          code: string
          display_label: string
          is_selectable: boolean
          primary_assignment_eligible: boolean
          sort_order: number
          work_attribution_eligible: boolean
        }
        Insert: {
          admin_eligible: boolean
          code: string
          display_label: string
          is_selectable?: boolean
          primary_assignment_eligible: boolean
          sort_order: number
          work_attribution_eligible: boolean
        }
        Update: {
          admin_eligible?: boolean
          code?: string
          display_label?: string
          is_selectable?: boolean
          primary_assignment_eligible?: boolean
          sort_order?: number
          work_attribution_eligible?: boolean
        }
        Relationships: []
      }
      product_policy_versions: {
        Row: {
          created_at: string
          due_soon_working_days: number
          effective_from: string
          effective_to: string | null
          max_work_log_entries: number
          stale_after_working_days: number
          version: number
          week_starts_on: number
          working_days: number[]
        }
        Insert: {
          created_at?: string
          due_soon_working_days: number
          effective_from: string
          effective_to?: string | null
          max_work_log_entries: number
          stale_after_working_days: number
          version: number
          week_starts_on: number
          working_days: number[]
        }
        Update: {
          created_at?: string
          due_soon_working_days?: number
          effective_from?: string
          effective_to?: string | null
          max_work_log_entries?: number
          stale_after_working_days?: number
          version?: number
          week_starts_on?: number
          working_days?: number[]
        }
        Relationships: []
      }
      profile_access_periods: {
        Row: {
          changed_by: string | null
          end_operation_id: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          is_admin: boolean
          position_code: string
          profile_id: string
          start_operation_id: string
          started_at: string
        }
        Insert: {
          changed_by?: string | null
          end_operation_id?: string | null
          ended_at?: string | null
          id?: string
          is_active: boolean
          is_admin: boolean
          position_code: string
          profile_id: string
          start_operation_id: string
          started_at: string
        }
        Update: {
          changed_by?: string | null
          end_operation_id?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
          position_code?: string
          profile_id?: string
          start_operation_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_access_periods_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_access_periods_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_access_periods_end_operation_id_fkey"
            columns: ["end_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_access_periods_position_code_fkey"
            columns: ["position_code"]
            isOneToOne: false
            referencedRelation: "position_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "profile_access_periods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_access_periods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_access_periods_start_operation_id_fkey"
            columns: ["start_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          current_reports_to_id: string | null
          display_name: string
          email: string
          id: string
          is_active: boolean
          is_admin: boolean
          must_change_password: boolean
          position_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_reports_to_id?: string | null
          display_name: string
          email: string
          id: string
          is_active?: boolean
          is_admin?: boolean
          must_change_password?: boolean
          position_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_reports_to_id?: string | null
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          must_change_password?: boolean
          position_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_reports_to_id_fkey"
            columns: ["current_reports_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_reports_to_id_fkey"
            columns: ["current_reports_to_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_code_fkey"
            columns: ["position_code"]
            isOneToOne: false
            referencedRelation: "position_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
      reporting_line_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          end_operation_id: string | null
          ended_on: string | null
          id: string
          person_id: string
          start_operation_id: string
          started_on: string
          supervisor_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          end_operation_id?: string | null
          ended_on?: string | null
          id?: string
          person_id: string
          start_operation_id: string
          started_on: string
          supervisor_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          end_operation_id?: string | null
          ended_on?: string | null
          id?: string
          person_id?: string
          start_operation_id?: string
          started_on?: string
          supervisor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporting_line_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_line_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_line_assignments_end_operation_id_fkey"
            columns: ["end_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_line_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_line_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_line_assignments_start_operation_id_fkey"
            columns: ["start_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_line_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_line_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          active_position: number | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          id: string
          is_completed: boolean
          position: number
          title: string
          updated_at: string
          withdrawn_at: string | null
          withdrawn_by: string | null
          work_item_id: string
        }
        Insert: {
          active_position?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_completed?: boolean
          position: number
          title: string
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id: string
        }
        Update: {
          active_position?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_completed?: boolean
          position?: number
          title?: string
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      team_settings: {
        Row: {
          singleton_key: boolean
          timezone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          singleton_key?: boolean
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          singleton_key?: boolean
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      work_areas: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          sort_order: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_areas_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_areas_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_areas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_areas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_areas_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_areas_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_assignments: {
        Row: {
          assigned_by: string
          assignee_id: string
          end_operation_id: string | null
          ended_at: string | null
          ended_on: string | null
          id: string
          start_operation_id: string
          started_at: string
          started_on: string
          work_item_id: string
        }
        Insert: {
          assigned_by: string
          assignee_id: string
          end_operation_id?: string | null
          ended_at?: string | null
          ended_on?: string | null
          id?: string
          start_operation_id: string
          started_at: string
          started_on: string
          work_item_id: string
        }
        Update: {
          assigned_by?: string
          assignee_id?: string
          end_operation_id?: string | null
          ended_at?: string | null
          ended_on?: string | null
          id?: string
          start_operation_id?: string
          started_at?: string
          started_on?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_assignments_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_assignments_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_assignments_end_operation_id_fkey"
            columns: ["end_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_assignments_start_operation_id_fkey"
            columns: ["start_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_assignments_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_event_types: {
        Row: {
          code: string
        }
        Insert: {
          code: string
        }
        Update: {
          code?: string
        }
        Relationships: []
      }
      work_item_events: {
        Row: {
          actor_id: string
          event_type_code: string
          id: string
          new_values: Json | null
          occurred_at: string
          operation_id: string
          previous_values: Json | null
          subject_id: string | null
          subject_type: string
          work_item_id: string
        }
        Insert: {
          actor_id: string
          event_type_code: string
          id?: string
          new_values?: Json | null
          occurred_at?: string
          operation_id: string
          previous_values?: Json | null
          subject_id?: string | null
          subject_type: string
          work_item_id: string
        }
        Update: {
          actor_id?: string
          event_type_code?: string
          id?: string
          new_values?: Json | null
          occurred_at?: string
          operation_id?: string
          previous_values?: Json | null
          subject_id?: string | null
          subject_type?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_events_event_type_code_fkey"
            columns: ["event_type_code"]
            isOneToOne: false
            referencedRelation: "work_item_event_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "work_item_events_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_events_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_labels: {
        Row: {
          applied_at: string
          applied_by: string
          apply_operation_id: string
          id: string
          label_id: string
          remove_operation_id: string | null
          removed_at: string | null
          removed_by: string | null
          work_item_id: string
        }
        Insert: {
          applied_at?: string
          applied_by: string
          apply_operation_id: string
          id?: string
          label_id: string
          remove_operation_id?: string | null
          removed_at?: string | null
          removed_by?: string | null
          work_item_id: string
        }
        Update: {
          applied_at?: string
          applied_by?: string
          apply_operation_id?: string
          id?: string
          label_id?: string
          remove_operation_id?: string | null
          removed_at?: string | null
          removed_by?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_labels_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_apply_operation_id_fkey"
            columns: ["apply_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_remove_operation_id_fkey"
            columns: ["remove_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_labels_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          changed_on: string
          from_status_code: string | null
          id: string
          operation_id: string
          to_status_code: string
          work_item_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          changed_on: string
          from_status_code?: string | null
          id?: string
          operation_id: string
          to_status_code: string
          work_item_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          changed_on?: string
          from_status_code?: string | null
          id?: string
          operation_id?: string
          to_status_code?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_status_history_from_status_code_fkey"
            columns: ["from_status_code"]
            isOneToOne: false
            referencedRelation: "work_item_statuses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "work_item_status_history_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_status_history_to_status_code_fkey"
            columns: ["to_status_code"]
            isOneToOne: false
            referencedRelation: "work_item_statuses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "work_item_status_history_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_status_transitions: {
        Row: {
          from_status_code: string
          introduced_in_policy_version: number
          is_allowed: boolean
          to_status_code: string
        }
        Insert: {
          from_status_code: string
          introduced_in_policy_version: number
          is_allowed: boolean
          to_status_code: string
        }
        Update: {
          from_status_code?: string
          introduced_in_policy_version?: number
          is_allowed?: boolean
          to_status_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_status_transitions_from_status_code_fkey"
            columns: ["from_status_code"]
            isOneToOne: false
            referencedRelation: "work_item_statuses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "work_item_status_transitions_to_status_code_fkey"
            columns: ["to_status_code"]
            isOneToOne: false
            referencedRelation: "work_item_statuses"
            referencedColumns: ["code"]
          },
        ]
      }
      work_item_statuses: {
        Row: {
          archive_eligible: boolean
          code: string
          display_label: string
          is_selectable: boolean
          reporting_bucket: string
          requires_primary_assignee: boolean
          sort_order: number
        }
        Insert: {
          archive_eligible: boolean
          code: string
          display_label: string
          is_selectable?: boolean
          reporting_bucket: string
          requires_primary_assignee: boolean
          sort_order: number
        }
        Update: {
          archive_eligible?: boolean
          code?: string
          display_label?: string
          is_selectable?: boolean
          reporting_bucket?: string
          requires_primary_assignee?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      work_items: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          area_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          display_id: string | null
          due_date: string | null
          figma_url: string | null
          id: string
          last_activity_at: string
          last_worked_on: string | null
          planned_start_date: string | null
          primary_assignee_id: string | null
          status_code: string
          title: string
          updated_at: string
          work_item_number: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          area_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          display_id?: string | null
          due_date?: string | null
          figma_url?: string | null
          id?: string
          last_activity_at?: string
          last_worked_on?: string | null
          planned_start_date?: string | null
          primary_assignee_id?: string | null
          status_code?: string
          title: string
          updated_at?: string
          work_item_number?: never
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          area_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          display_id?: string | null
          due_date?: string | null
          figma_url?: string | null
          id?: string
          last_activity_at?: string
          last_worked_on?: string | null
          planned_start_date?: string | null
          primary_assignee_id?: string | null
          status_code?: string
          title?: string
          updated_at?: string
          work_item_number?: never
        }
        Relationships: [
          {
            foreignKeyName: "work_items_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_primary_assignee_id_fkey"
            columns: ["primary_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_primary_assignee_id_fkey"
            columns: ["primary_assignee_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_status_code_fkey"
            columns: ["status_code"]
            isOneToOne: false
            referencedRelation: "work_item_statuses"
            referencedColumns: ["code"]
          },
        ]
      }
      work_log_batch_revisions: {
        Row: {
          batch_id: string
          change_kind: string
          changed_at: string
          changed_by: string
          id: string
          new_values: Json
          operation_id: string
          previous_values: Json
          revision_number: number
        }
        Insert: {
          batch_id: string
          change_kind: string
          changed_at?: string
          changed_by: string
          id?: string
          new_values: Json
          operation_id: string
          previous_values: Json
          revision_number: number
        }
        Update: {
          batch_id?: string
          change_kind?: string
          changed_at?: string
          changed_by?: string
          id?: string
          new_values?: Json
          operation_id?: string
          previous_values?: Json
          revision_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_log_batch_revisions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "work_log_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batch_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batch_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batch_revisions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      work_log_batches: {
        Row: {
          context_code: string
          create_operation_id: string
          created_at: string
          edited_at: string | null
          id: string
          logged_by: string
          related_area_id: string | null
          withdrawn_at: string | null
          withdrawn_by: string | null
          work_item_id: string | null
          worked_by: string
        }
        Insert: {
          context_code: string
          create_operation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          logged_by: string
          related_area_id?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id?: string | null
          worked_by: string
        }
        Update: {
          context_code?: string
          create_operation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          logged_by?: string
          related_area_id?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id?: string | null
          worked_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_log_batches_create_operation_id_fkey"
            columns: ["create_operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_related_area_id_fkey"
            columns: ["related_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_worked_by_fkey"
            columns: ["worked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_worked_by_fkey"
            columns: ["worked_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      work_log_entries: {
        Row: {
          batch_id: string
          created_at: string
          description: string | null
          id: string
          position: number
          updated_at: string
          withdrawn_at: string | null
          withdrawn_by: string | null
          work_date: string
          work_type_code: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          description?: string | null
          id?: string
          position: number
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_date: string
          work_type_code: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_date?: string
          work_type_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_log_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "work_log_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entries_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entries_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entries_work_type_code_fkey"
            columns: ["work_type_code"]
            isOneToOne: false
            referencedRelation: "work_type_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
      work_log_entry_revisions: {
        Row: {
          change_kind: string
          changed_at: string
          changed_by: string
          entry_id: string
          id: string
          new_values: Json
          operation_id: string
          previous_values: Json
          revision_number: number
        }
        Insert: {
          change_kind: string
          changed_at?: string
          changed_by: string
          entry_id: string
          id?: string
          new_values: Json
          operation_id: string
          previous_values: Json
          revision_number: number
        }
        Update: {
          change_kind?: string
          changed_at?: string
          changed_by?: string
          entry_id?: string
          id?: string
          new_values?: Json
          operation_id?: string
          previous_values?: Json
          revision_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_log_entry_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entry_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entry_revisions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "valid_work_log_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entry_revisions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "work_log_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entry_revisions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      work_type_definitions: {
        Row: {
          code: string
          context_code: string
          display_label: string
          is_selectable: boolean
          sort_order: number
        }
        Insert: {
          code: string
          context_code: string
          display_label: string
          is_selectable?: boolean
          sort_order: number
        }
        Update: {
          code?: string
          context_code?: string
          display_label?: string
          is_selectable?: boolean
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      current_work_item_contributors: {
        Row: {
          profile_id: string | null
          work_item_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_log_batches_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_worked_by_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_worked_by_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      team_directory: {
        Row: {
          current_reports_to_id: string | null
          display_name: string | null
          id: string | null
          is_admin: boolean | null
          position_code: string | null
        }
        Insert: {
          current_reports_to_id?: string | null
          display_name?: string | null
          id?: string | null
          is_admin?: boolean | null
          position_code?: string | null
        }
        Update: {
          current_reports_to_id?: string | null
          display_name?: string | null
          id?: string | null
          is_admin?: boolean | null
          position_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_reports_to_id_fkey"
            columns: ["current_reports_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_reports_to_id_fkey"
            columns: ["current_reports_to_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_code_fkey"
            columns: ["position_code"]
            isOneToOne: false
            referencedRelation: "position_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
      valid_work_log_entries: {
        Row: {
          batch_id: string | null
          context_code: string | null
          description: string | null
          id: string | null
          last_edited_at: string | null
          logged_at: string | null
          logged_by: string | null
          position: number | null
          related_area_id: string | null
          work_date: string | null
          work_item_id: string | null
          work_type_code: string | null
          worked_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_log_batches_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_related_area_id_fkey"
            columns: ["related_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_worked_by_fkey"
            columns: ["worked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_batches_worked_by_fkey"
            columns: ["worked_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "work_log_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_entries_work_type_code_fkey"
            columns: ["work_type_code"]
            isOneToOne: false
            referencedRelation: "work_type_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
      visible_comments: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string | null
          edited_at: string | null
          id: string | null
          withdrawn_at: string | null
          withdrawn_by: string | null
          work_item_id: string | null
        }
        Insert: {
          author_id?: string | null
          body?: never
          created_at?: string | null
          edited_at?: string | null
          id?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id?: string | null
        }
        Update: {
          author_id?: string | null
          body?: never
          created_at?: string | null
          edited_at?: string | null
          id?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
          work_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_withdrawn_by_fkey"
            columns: ["withdrawn_by"]
            isOneToOne: false
            referencedRelation: "team_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_active_work_days: {
        Row: {
          active_work_days: number | null
          work_item_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_log_batches_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

