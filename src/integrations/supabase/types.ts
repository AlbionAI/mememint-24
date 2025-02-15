export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      raydium_listings: {
        Row: {
          created_at: string | null
          id: string
          mint_address: string
          owner_address: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mint_address: string
          owner_address: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mint_address?: string
          owner_address?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raydium_listings_mint_address_fkey"
            columns: ["mint_address"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["mint_address"]
          },
        ]
      }
      token_fees: {
        Row: {
          base_fee: number
          created_at: string | null
          id: string
          modify_creator_fee: number | null
          revoke_freeze_fee: number | null
          revoke_mint_fee: number | null
          revoke_update_fee: number | null
          token_mint_address: string
          total_fee: number
        }
        Insert: {
          base_fee: number
          created_at?: string | null
          id?: string
          modify_creator_fee?: number | null
          revoke_freeze_fee?: number | null
          revoke_mint_fee?: number | null
          revoke_update_fee?: number | null
          token_mint_address: string
          total_fee: number
        }
        Update: {
          base_fee?: number
          created_at?: string | null
          id?: string
          modify_creator_fee?: number | null
          revoke_freeze_fee?: number | null
          revoke_mint_fee?: number | null
          revoke_update_fee?: number | null
          token_mint_address?: string
          total_fee?: number
        }
        Relationships: []
      }
      tokens: {
        Row: {
          created_at: string | null
          description: string | null
          discord: string | null
          id: string
          logo_url: string | null
          mint_address: string
          owner_address: string
          telegram: string | null
          token_name: string
          token_symbol: string
          twitter: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discord?: string | null
          id?: string
          logo_url?: string | null
          mint_address: string
          owner_address: string
          telegram?: string | null
          token_name: string
          token_symbol: string
          twitter?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discord?: string | null
          id?: string
          logo_url?: string | null
          mint_address?: string
          owner_address?: string
          telegram?: string | null
          token_name?: string
          token_symbol?: string
          twitter?: string | null
          website?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
