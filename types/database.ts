export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'pending_approval'
export type SocialPlatform = 'facebook' | 'instagram'
export type AccountStatus = 'active' | 'inactive' | 'token_expired'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'editor' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'editor' | 'viewer'
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      social_accounts: {
        Row: {
          id: string
          user_id: string
          platform: SocialPlatform
          account_name: string
          account_id: string
          access_token: string
          token_expires_at: string | null
          status: AccountStatus
          page_picture_url: string | null
          followers_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: SocialPlatform
          account_name: string
          account_id: string
          access_token: string
          token_expires_at?: string | null
          status?: AccountStatus
          page_picture_url?: string | null
          followers_count?: number | null
        }
        Update: Partial<Database['public']['Tables']['social_accounts']['Insert']>
      }
      posts: {
        Row: {
          id: string
          user_id: string
          social_account_id: string
          title: string | null
          content: string
          media_urls: string[]
          status: PostStatus
          scheduled_at: string | null
          published_at: string | null
          platform_post_id: string | null
          error_message: string | null
          tags: string[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          social_account_id: string
          title?: string | null
          content: string
          media_urls?: string[]
          status?: PostStatus
          scheduled_at?: string | null
          published_at?: string | null
          platform_post_id?: string | null
          error_message?: string | null
          tags?: string[]
          metadata?: Json
        }
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      assets: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          public_url: string | null
          width: number | null
          height: number | null
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          public_url?: string | null
          width?: number | null
          height?: number | null
          tags?: string[]
        }
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }
      post_analytics: {
        Row: {
          id: string
          post_id: string
          likes: number
          comments: number
          shares: number
          reach: number
          impressions: number
          clicks: number
          recorded_at: string
        }
        Insert: {
          id?: string
          post_id: string
          likes?: number
          comments?: number
          shares?: number
          reach?: number
          impressions?: number
          clicks?: number
        }
        Update: Partial<Database['public']['Tables']['post_analytics']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      post_status: PostStatus
      social_platform: SocialPlatform
      account_status: AccountStatus
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type SocialAccount = Database['public']['Tables']['social_accounts']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type PostAnalytics = Database['public']['Tables']['post_analytics']['Row']

export type PostWithAccount = Post & {
  social_accounts: Pick<SocialAccount, 'account_name' | 'platform' | 'page_picture_url'>
}
