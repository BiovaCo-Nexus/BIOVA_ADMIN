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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      application_remarks: {
        Row: {
          admin_name: string | null
          application_id: string
          body: string
          created_at: string
          id: string
          sender_type: string | null
          subject: string
          to_email: string
        }
        Insert: {
          admin_name?: string | null
          application_id: string
          body: string
          created_at?: string
          id?: string
          sender_type?: string | null
          subject: string
          to_email: string
        }
        Update: {
          admin_name?: string | null
          application_id?: string
          body?: string
          created_at?: string
          id?: string
          sender_type?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          application_id: string
          changed_at?: string
          id?: string
          notes?: string | null
          status: string
        }
        Update: {
          application_id?: string
          changed_at?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["application_id"]
          },
        ]
      }
      contact_location: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string | null
          id: number
          is_active: boolean | null
          latitude: number
          longitude: number
          postal_code: string | null
          state: string
          updated_at: string | null
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          latitude: number
          longitude: number
          postal_code?: string | null
          state: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          postal_code?: string | null
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      countdown_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          target_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          target_date: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          target_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      database_usage_stats: {
        Row: {
          additional_info: Json | null
          id: string
          last_updated: string
          record_count: number
          storage_size: string | null
          table_name: string
        }
        Insert: {
          additional_info?: Json | null
          id?: string
          last_updated?: string
          record_count?: number
          storage_size?: string | null
          table_name: string
        }
        Update: {
          additional_info?: Json | null
          id?: string
          last_updated?: string
          record_count?: number
          storage_size?: string | null
          table_name?: string
        }
        Relationships: []
      }
      festival_posts: {
        Row: {
          caption: string | null
          created_at: string | null
          date: string
          detailed_content: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          date: string
          detailed_content?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          date?: string
          detailed_content?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      interns: {
        Row: {
          bio: string | null
          branch: string | null
          college: string | null
          contact: string | null
          created_at: string
          email: string
          end_date: string | null
          id: string
          id_proof_url: string | null
          is_featured: boolean | null
          joining_date: string | null
          name: string
          offer_letter_url: string | null
          photo_url: string | null
          position: string | null
          project_department: string | null
          status: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          bio?: string | null
          branch?: string | null
          college?: string | null
          contact?: string | null
          created_at?: string
          email: string
          end_date?: string | null
          id?: string
          id_proof_url?: string | null
          is_featured?: boolean | null
          joining_date?: string | null
          name: string
          offer_letter_url?: string | null
          photo_url?: string | null
          position?: string | null
          project_department?: string | null
          status?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          bio?: string | null
          branch?: string | null
          college?: string | null
          contact?: string | null
          created_at?: string
          email?: string
          end_date?: string | null
          id?: string
          id_proof_url?: string | null
          is_featured?: boolean | null
          joining_date?: string | null
          name?: string
          offer_letter_url?: string | null
          photo_url?: string | null
          position?: string | null
          project_department?: string | null
          status?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          application_id: string | null
          cover_letter: string | null
          created_at: string
          email: string
          experience_years: number
          full_name: string
          id: string
          pdf_url: string | null
          phone: string
          resume_url: string | null
          role: string
          signature_image: string | null
          skills: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          cover_letter?: string | null
          created_at?: string
          email: string
          experience_years?: number
          full_name: string
          id?: string
          pdf_url?: string | null
          phone: string
          resume_url?: string | null
          role: string
          signature_image?: string | null
          skills?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          cover_letter?: string | null
          created_at?: string
          email?: string
          experience_years?: number
          full_name?: string
          id?: string
          pdf_url?: string | null
          phone?: string
          resume_url?: string | null
          role?: string
          signature_image?: string | null
          skills?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_positions: {
        Row: {
          application_deadline: string | null
          benefits: string | null
          contact_email: string | null
          created_at: string
          department: string
          description: string
          detailed_description: string | null
          display_order: number
          employment_type: string | null
          experience_level: string | null
          id: string
          is_active: boolean
          job_type: string
          location: string
          qualifications: string | null
          remote_work_available: boolean | null
          requirements: string | null
          responsibilities: string | null
          role_key: string
          salary_range: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          benefits?: string | null
          contact_email?: string | null
          created_at?: string
          department: string
          description: string
          detailed_description?: string | null
          display_order?: number
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string
          location: string
          qualifications?: string | null
          remote_work_available?: boolean | null
          requirements?: string | null
          responsibilities?: string | null
          role_key: string
          salary_range?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          benefits?: string | null
          contact_email?: string | null
          created_at?: string
          department?: string
          description?: string
          detailed_description?: string | null
          display_order?: number
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string
          location?: string
          qualifications?: string | null
          remote_work_available?: boolean | null
          requirements?: string | null
          responsibilities?: string | null
          role_key?: string
          salary_range?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_settings: {
        Row: {
          created_at: string
          estimated_completion: string | null
          id: string
          is_maintenance_mode: boolean | null
          maintenance_message: string | null
          maintenance_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_completion?: string | null
          id?: string
          is_maintenance_mode?: boolean | null
          maintenance_message?: string | null
          maintenance_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_completion?: string | null
          id?: string
          is_maintenance_mode?: boolean | null
          maintenance_message?: string | null
          maintenance_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_post_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          post_id: string | null
          user_name: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketing_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketing_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      model_3d: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      model_3d_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          model_id: string | null
          user_name: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          model_id?: string | null
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          model_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_3d_comments_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model_3d"
            referencedColumns: ["id"]
          },
        ]
      }
      model_3d_likes: {
        Row: {
          created_at: string | null
          id: string
          model_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_3d_likes_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model_3d"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          id: string
          images: string | null
          page_name: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string | null
          page_name: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string | null
          page_name?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          post_id: string | null
          updated_at: string | null
          user_email: string | null
          user_name: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          post_id?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_name: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          post_id?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "festival_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_countdown_content: {
        Row: {
          created_at: string
          cta1_link: string | null
          cta1_text: string | null
          cta2_link: string | null
          cta2_text: string | null
          cta3_link: string | null
          cta3_text: string | null
          hero_video_description: string | null
          hero_video_url: string | null
          id: number
          join_movement_cta1_link: string | null
          join_movement_cta1_text: string | null
          join_movement_cta2_link: string | null
          join_movement_cta2_text: string | null
          join_movement_cta3_link: string | null
          join_movement_cta3_text: string | null
          join_movement_title: string | null
          roadmap_subtitle: string | null
          roadmap_title: string | null
          selected_countdown_id: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
          video_story_subtitle: string | null
          video_story_title: string | null
        }
        Insert: {
          created_at?: string
          cta1_link?: string | null
          cta1_text?: string | null
          cta2_link?: string | null
          cta2_text?: string | null
          cta3_link?: string | null
          cta3_text?: string | null
          hero_video_description?: string | null
          hero_video_url?: string | null
          id?: never
          join_movement_cta1_link?: string | null
          join_movement_cta1_text?: string | null
          join_movement_cta2_link?: string | null
          join_movement_cta2_text?: string | null
          join_movement_cta3_link?: string | null
          join_movement_cta3_text?: string | null
          join_movement_title?: string | null
          roadmap_subtitle?: string | null
          roadmap_title?: string | null
          selected_countdown_id?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_story_subtitle?: string | null
          video_story_title?: string | null
        }
        Update: {
          created_at?: string
          cta1_link?: string | null
          cta1_text?: string | null
          cta2_link?: string | null
          cta2_text?: string | null
          cta3_link?: string | null
          cta3_text?: string | null
          hero_video_description?: string | null
          hero_video_url?: string | null
          id?: never
          join_movement_cta1_link?: string | null
          join_movement_cta1_text?: string | null
          join_movement_cta2_link?: string | null
          join_movement_cta2_text?: string | null
          join_movement_cta3_link?: string | null
          join_movement_cta3_text?: string | null
          join_movement_title?: string | null
          roadmap_subtitle?: string | null
          roadmap_title?: string | null
          selected_countdown_id?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_story_subtitle?: string | null
          video_story_title?: string | null
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_ip: string
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_ip: string
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_ip?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "festival_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_backups: {
        Row: {
          backup_data: Json
          backup_name: string
          backup_type: string
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          size_mb: number | null
          status: string
        }
        Insert: {
          backup_data: Json
          backup_name: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          size_mb?: number | null
          status?: string
        }
        Update: {
          backup_data?: Json
          backup_name?: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          size_mb?: number | null
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          setting_name: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          setting_name: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          setting_name?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          content: string
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string | null
          attachment_url: string | null
          comments: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          intern_id: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          attachment_url?: string | null
          comments?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          intern_id?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          attachment_url?: string | null
          comments?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          intern_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "interns"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          department: string | null
          display_order: number
          email: string | null
          id: string
          is_active: boolean
          is_executive: string | null
          is_founder: string | null
          linkedin: string | null
          linkedin_url: string | null
          name: string
          photo_url: string | null
          position: string | null
          role: string | null
          twitter: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department?: string | null
          display_order?: number
          email?: string | null
          id?: string
          is_active?: boolean
          is_executive?: string | null
          is_founder?: string | null
          linkedin?: string | null
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          position?: string | null
          role?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          department?: string | null
          display_order?: number
          email?: string | null
          id?: string
          is_active?: boolean
          is_executive?: string | null
          is_founder?: string | null
          linkedin?: string | null
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          position?: string | null
          role?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      visitor_stats: {
        Row: {
          id: string
          last_updated: string
          visitor_count: number
        }
        Insert: {
          id?: string
          last_updated?: string
          visitor_count?: number
        }
        Update: {
          id?: string
          last_updated?: string
          visitor_count?: number
        }
        Relationships: []
      }
      visitors: {
        Row: {
          created_at: string
          id: number
          ip_address: string | null
          last_seen_at: string
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          ip_address?: string | null
          last_seen_at?: string
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          ip_address?: string | null
          last_seen_at?: string
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      website_videos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          embed_url: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          video_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          embed_url: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          video_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          embed_url?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          video_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_contact_location: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          city: string
          country: string
          created_at: string
          id: number
          is_active: boolean
          latitude: number
          longitude: number
          postal_code: string
          state: string
          updated_at: string
        }[]
      }
      get_database_usage: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_visitor_stats: {
        Args: Record<PropertyKey, never>
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
    Enums: {},
  },
} as const
