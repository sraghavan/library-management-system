import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema types
export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          isbn?: string;
          description?: string;
          published_date?: string;
          image_url?: string;
          genre?: string;
          is_available: boolean;
          borrowed_by?: string;
          borrowed_date?: string;
          source_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          isbn?: string;
          description?: string;
          published_date?: string;
          image_url?: string;
          genre?: string;
          is_available?: boolean;
          borrowed_by?: string;
          borrowed_date?: string;
          source_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          author?: string;
          isbn?: string;
          description?: string;
          published_date?: string;
          image_url?: string;
          genre?: string;
          is_available?: boolean;
          borrowed_by?: string;
          borrowed_date?: string;
          source_url?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          email?: string;
          phone?: string;
          registration_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string;
          phone?: string;
          registration_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          registration_date?: string;
          updated_at?: string;
        };
      };
    };
  };
}