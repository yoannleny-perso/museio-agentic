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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bsb_number: string
          created_at: string
          fund_abn: string | null
          fund_name: string | null
          fund_usi: string | null
          id: string
          include_super_in_invoices: boolean
          member_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bsb_number: string
          created_at?: string
          fund_abn?: string | null
          fund_name?: string | null
          fund_usi?: string | null
          id?: string
          include_super_in_invoices?: boolean
          member_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bsb_number?: string
          created_at?: string
          fund_abn?: string | null
          fund_name?: string | null
          fund_usi?: string | null
          id?: string
          include_super_in_invoices?: boolean
          member_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          budget: number | null
          created_at: string
          event_date: string
          event_description: string | null
          event_end_date: string | null
          event_end_time: string | null
          event_name: string | null
          event_start_time: string | null
          id: string
          location: string | null
          phone: string | null
          portfolio_user_id: string
          quoted_price: number | null
          requester_email: string
          requester_name: string
          special_requirements: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          event_date: string
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_name?: string | null
          event_start_time?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          portfolio_user_id: string
          quoted_price?: number | null
          requester_email: string
          requester_name: string
          special_requirements?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          event_date?: string
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_name?: string | null
          event_start_time?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          portfolio_user_id?: string
          quoted_price?: number | null
          requester_email?: string
          requester_name?: string
          special_requirements?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_name: string | null
          created_at: string
          email_address: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
          user_id: string
          venue_name: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email_address?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          venue_name: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email_address?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          venue_name?: string
        }
        Relationships: []
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          expires_at: string | null
          id: string
          invoice_id: string | null
          paid_at: string | null
          payment_url: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_link_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          payment_url: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_link_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          payment_url?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_link_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sent_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          absorb_payment_fees: boolean | null
          add_gst: boolean
          auto_reminders_enabled: boolean | null
          created_at: string
          footer_notes: string | null
          format: string
          id: string
          logo_path: string | null
          payment_terms: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          absorb_payment_fees?: boolean | null
          add_gst?: boolean
          auto_reminders_enabled?: boolean | null
          created_at?: string
          footer_notes?: string | null
          format?: string
          id?: string
          logo_path?: string | null
          payment_terms?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          absorb_payment_fees?: boolean | null
          add_gst?: boolean
          auto_reminders_enabled?: boolean | null
          created_at?: string
          footer_notes?: string | null
          format?: string
          id?: string
          logo_path?: string | null
          payment_terms?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      job_items: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          is_taxable: boolean
          item_name: string
          job_id: string
          quantity: number
          sort_order: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_taxable?: boolean
          item_name: string
          job_id: string
          quantity?: number
          sort_order?: number
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_taxable?: boolean
          item_name?: string
          job_id?: string
          quantity?: number
          sort_order?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          client: string
          client_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          date: string
          discount_percent: number | null
          end_date: string | null
          end_time: string
          id: string
          idempotency_key: string | null
          job_description: string | null
          job_number: string | null
          location: string
          notes: string | null
          pricing_mode: string | null
          rate: number
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client: string
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          date: string
          discount_percent?: number | null
          end_date?: string | null
          end_time: string
          id?: string
          idempotency_key?: string | null
          job_description?: string | null
          job_number?: string | null
          location: string
          notes?: string | null
          pricing_mode?: string | null
          rate: number
          start_time: string
          status: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client?: string
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          date?: string
          discount_percent?: number | null
          end_date?: string | null
          end_time?: string
          id?: string
          idempotency_key?: string | null
          job_description?: string | null
          job_number?: string | null
          location?: string
          notes?: string | null
          pricing_mode?: string | null
          rate?: number
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          id: string
          receive_email_copies: boolean
          receive_push_notifications: boolean | null
          send_job_cancellations: boolean
          send_job_confirmation: boolean
          send_job_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          receive_email_copies?: boolean
          receive_push_notifications?: boolean | null
          send_job_cancellations?: boolean
          send_job_confirmation?: boolean
          send_job_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          receive_email_copies?: boolean
          receive_push_notifications?: boolean | null
          send_job_cancellations?: boolean
          send_job_confirmation?: boolean
          send_job_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_events: {
        Row: {
          created_at: string
          display_order: number | null
          event_date: string
          event_name: string
          flyer_image_url: string | null
          id: string
          is_enabled: boolean | null
          location: string | null
          section_id: string | null
          ticket_url: string | null
          updated_at: string
          user_id: string
          username: string | null
          venue: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          event_date: string
          event_name: string
          flyer_image_url?: string | null
          id?: string
          is_enabled?: boolean | null
          location?: string | null
          section_id?: string | null
          ticket_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          venue: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          event_date?: string
          event_name?: string
          flyer_image_url?: string | null
          id?: string
          is_enabled?: boolean | null
          location?: string | null
          section_id?: string | null
          ticket_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          venue?: string
        }
        Relationships: []
      }
      portfolio_featured_cards: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          button_link: string | null
          button_text: string | null
          created_at: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          is_enabled: boolean | null
          section_id: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean | null
          section_id?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean | null
          section_id?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      portfolio_music_releases: {
        Row: {
          apple_music_link: string | null
          artist_name: string | null
          beatport_link: string | null
          cover_image_url: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_enabled: boolean | null
          release_date: string | null
          section_id: string | null
          soundcloud_link: string | null
          spotify_link: string | null
          title: string
          updated_at: string | null
          user_id: string
          username: string | null
          youtube_link: string | null
        }
        Insert: {
          apple_music_link?: string | null
          artist_name?: string | null
          beatport_link?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          release_date?: string | null
          section_id?: string | null
          soundcloud_link?: string | null
          spotify_link?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          username?: string | null
          youtube_link?: string | null
        }
        Update: {
          apple_music_link?: string | null
          artist_name?: string | null
          beatport_link?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          release_date?: string | null
          section_id?: string | null
          soundcloud_link?: string | null
          spotify_link?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          username?: string | null
          youtube_link?: string | null
        }
        Relationships: []
      }
      portfolio_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          section_id: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          section_id?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          section_id?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      portfolio_settings: {
        Row: {
          artist_name: string | null
          background_gradient: string | null
          background_image_url: string | null
          background_video_url: string | null
          bio_full: string | null
          bio_short: string | null
          created_at: string
          enabled_sections: Json | null
          genre_tagline: string | null
          id: string
          is_public: boolean | null
          layout_preferences: Json | null
          portfolio_slug: string | null
          profile_image_url: string | null
          quick_links: Json | null
          section_configs: Json | null
          section_order: Json | null
          section_titles: Json | null
          social_links: Json | null
          theme_colors: Json | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          artist_name?: string | null
          background_gradient?: string | null
          background_image_url?: string | null
          background_video_url?: string | null
          bio_full?: string | null
          bio_short?: string | null
          created_at?: string
          enabled_sections?: Json | null
          genre_tagline?: string | null
          id?: string
          is_public?: boolean | null
          layout_preferences?: Json | null
          portfolio_slug?: string | null
          profile_image_url?: string | null
          quick_links?: Json | null
          section_configs?: Json | null
          section_order?: Json | null
          section_titles?: Json | null
          social_links?: Json | null
          theme_colors?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          artist_name?: string | null
          background_gradient?: string | null
          background_image_url?: string | null
          background_video_url?: string | null
          bio_full?: string | null
          bio_short?: string | null
          created_at?: string
          enabled_sections?: Json | null
          genre_tagline?: string | null
          id?: string
          is_public?: boolean | null
          layout_preferences?: Json | null
          portfolio_slug?: string | null
          profile_image_url?: string | null
          quick_links?: Json | null
          section_configs?: Json | null
          section_order?: Json | null
          section_titles?: Json | null
          social_links?: Json | null
          theme_colors?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      portfolio_videos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_enabled: boolean | null
          section_id: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          username: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          section_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          section_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          abn: string | null
          company_address: string | null
          company_name: string | null
          created_at: string
          email: string | null
          fcm_token: string | null
          first_name: string | null
          id: string
          industry: string | null
          last_name: string | null
          nickname: string | null
          phone: string | null
          stripe_account_id: string | null
          stripe_onboarding_completed: boolean | null
          updated_at: string
          username: string | null
          verification_details: Json | null
          verification_status: string | null
        }
        Insert: {
          abn?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          fcm_token?: string | null
          first_name?: string | null
          id: string
          industry?: string | null
          last_name?: string | null
          nickname?: string | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean | null
          updated_at?: string
          username?: string | null
          verification_details?: Json | null
          verification_status?: string | null
        }
        Update: {
          abn?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          fcm_token?: string | null
          first_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          nickname?: string | null
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean | null
          updated_at?: string
          username?: string | null
          verification_details?: Json | null
          verification_status?: string | null
        }
        Relationships: []
      }
      sent_invoices: {
        Row: {
          amount: number
          client_email: string
          due_date: string | null
          id: string
          invoice_number: string
          job_id: string | null
          last_reminder_sent_at: string | null
          sent_at: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          client_email: string
          due_date?: string | null
          id?: string
          invoice_number: string
          job_id?: string | null
          last_reminder_sent_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          client_email?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          job_id?: string | null
          last_reminder_sent_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_links: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          click_count: number | null
          created_at: string
          custom_styling: Json | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          is_featured: boolean | null
          is_visible: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          click_count?: number | null
          created_at?: string
          custom_styling?: Json | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_visible?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          click_count?: number | null
          created_at?: string
          custom_styling?: Json | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_visible?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          is_pattern: boolean | null
          slot_order: number | null
          specific_date: string | null
          start_time: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_available?: boolean
          is_pattern?: boolean | null
          slot_order?: number | null
          specific_date?: string | null
          start_time?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          is_pattern?: boolean | null
          slot_order?: number | null
          specific_date?: string | null
          start_time?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_availability_repeat_settings: {
        Row: {
          created_at: string
          id: string
          repeat_duration: string
          repeat_enabled: boolean
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          repeat_duration?: string
          repeat_enabled?: boolean
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          repeat_duration?: string
          repeat_enabled?: boolean
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      user_availability_settings: {
        Row: {
          break_duration_minutes: number
          buffer_time_minutes: number
          created_at: string
          enable_breaks: boolean
          id: string
          min_notice_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          break_duration_minutes?: number
          buffer_time_minutes?: number
          created_at?: string
          enable_breaks?: boolean
          id?: string
          min_notice_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          break_duration_minutes?: number
          buffer_time_minutes?: number
          created_at?: string
          enable_breaks?: boolean
          id?: string
          min_notice_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invoice_sequences: {
        Row: {
          created_at: string
          id: string
          next_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_number?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          bank_details_completed: boolean
          completed_at: string | null
          created_at: string
          has_seen_welcome_popup: boolean
          id: string
          invoice_setup_completed: boolean
          onboarding_completed: boolean
          profile_completed: boolean
          updated_at: string
          user_id: string
          verification_completed: boolean | null
          welcome_shown_at: string | null
        }
        Insert: {
          bank_details_completed?: boolean
          completed_at?: string | null
          created_at?: string
          has_seen_welcome_popup?: boolean
          id?: string
          invoice_setup_completed?: boolean
          onboarding_completed?: boolean
          profile_completed?: boolean
          updated_at?: string
          user_id: string
          verification_completed?: boolean | null
          welcome_shown_at?: string | null
        }
        Update: {
          bank_details_completed?: boolean
          completed_at?: string | null
          created_at?: string
          has_seen_welcome_popup?: boolean
          id?: string
          invoice_setup_completed?: boolean
          onboarding_completed?: boolean
          profile_completed?: boolean
          updated_at?: string
          user_id?: string
          verification_completed?: boolean | null
          welcome_shown_at?: string | null
        }
        Relationships: []
      }
      user_signatures: {
        Row: {
          created_at: string
          id: string
          signature: string
          signature_file_path: string | null
          signature_text: string | null
          signature_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signature: string
          signature_file_path?: string | null
          signature_text?: string | null
          signature_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signature?: string
          signature_file_path?: string | null
          signature_text?: string | null
          signature_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_vacation_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: { format_string: string }
        Returns: string
      }
      generate_invoice_number_for_user: {
        Args: { format_string: string; p_user_id: string }
        Returns: string
      }
      get_user_id_by_username: {
        Args: { lookup_username: string }
        Returns: string
      }
    }
    Enums: {
      booking_status: "drafted" | "upcoming" | "past" | "invoice-sent" | "paid"
      verification_status_type:
        | "not_started"
        | "pending"
        | "verified"
        | "rejected"
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
      booking_status: ["drafted", "upcoming", "past", "invoice-sent", "paid"],
      verification_status_type: [
        "not_started",
        "pending",
        "verified",
        "rejected",
      ],
    },
  },
} as const
