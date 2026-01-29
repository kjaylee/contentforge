export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'threads';

export interface PlatformOutput {
  content: string;
  hashtags?: string[];
  characterCount: number;
}

export interface GenerationOutputs {
  twitter?: PlatformOutput;
  linkedin?: PlatformOutput;
  instagram?: PlatformOutput;
  facebook?: PlatformOutput;
  threads?: PlatformOutput;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          tier: 'free' | 'creator' | 'pro' | 'agency';
          monthly_generations: number;
          generation_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          tier?: 'free' | 'creator' | 'pro' | 'agency';
          monthly_generations?: number;
          generation_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          tier?: 'free' | 'creator' | 'pro' | 'agency';
          monthly_generations?: number;
          generation_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          source_type: 'url' | 'text';
          source_url: string | null;
          source_text: string;
          source_title: string | null;
          outputs: GenerationOutputs;
          platforms: Platform[];
          tokens_used: number;
          processing_time_ms: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: 'url' | 'text';
          source_url?: string | null;
          source_text: string;
          source_title?: string | null;
          outputs: GenerationOutputs;
          platforms: Platform[];
          tokens_used?: number;
          processing_time_ms?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: 'url' | 'text';
          source_url?: string | null;
          source_text?: string;
          source_title?: string | null;
          outputs?: GenerationOutputs;
          platforms?: Platform[];
          tokens_used?: number;
          processing_time_ms?: number;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          status: 'inactive' | 'active' | 'canceled' | 'past_due';
          tier: 'free' | 'creator' | 'pro' | 'agency';
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: 'inactive' | 'active' | 'canceled' | 'past_due';
          tier?: 'free' | 'creator' | 'pro' | 'agency';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: 'inactive' | 'active' | 'canceled' | 'past_due';
          tier?: 'free' | 'creator' | 'pro' | 'agency';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
