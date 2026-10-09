export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      auditoria: {
        Row: {
          antes: Json | null;
          created_at: string;
          created_by: string | null;
          depois: Json | null;
          empresa_id: string;
          id: string;
          operacao: string;
          registro_id: string;
          tabela: string;
        };
        ComputedFields: never;
        Insert: {
          antes?: Json | null;
          created_at?: string;
          created_by?: string | null;
          depois?: Json | null;
          empresa_id: string;
          id?: string;
          operacao: string;
          registro_id: string;
          tabela: string;
        };
        Update: {
          antes?: Json | null;
          created_at?: string;
          created_by?: string | null;
          depois?: Json | null;
          empresa_id?: string;
          id?: string;
          operacao?: string;
          registro_id?: string;
          tabela?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'auditoria_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      empresas: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          nome: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          nome: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          nome?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usuarios: {
        Row: {
          admin_plataforma: boolean;
          created_at: string;
          email: string;
          id: string;
          nome: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          admin_plataforma?: boolean;
          created_at?: string;
          email: string;
          id: string;
          nome?: string;
          updated_at?: string;
        };
        Update: {
          admin_plataforma?: boolean;
          created_at?: string;
          email?: string;
          id?: string;
          nome?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vinculos: {
        Row: {
          created_at: string;
          created_by: string | null;
          empresa_id: string;
          id: string;
          papel: Database['public']['Enums']['papel'];
          updated_at: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          empresa_id: string;
          id?: string;
          papel: Database['public']['Enums']['papel'];
          updated_at?: string;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          empresa_id?: string;
          id?: string;
          papel?: Database['public']['Enums']['papel'];
          updated_at?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vinculos_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vinculos_usuario_id_fkey';
            columns: ['usuario_id'];
            isOneToOne: false;
            referencedRelation: 'usuarios';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      compartilha_empresa: { Args: { p_usuario_id: string }; Returns: boolean };
      criar_empresa: { Args: { p_nome: string }; Returns: string };
      eh_admin_plataforma: { Args: Record<PropertyKey, never>; Returns: boolean };
      mfa_ok: { Args: Record<PropertyKey, never>; Returns: boolean };
      precisa_mfa: { Args: Record<PropertyKey, never>; Returns: boolean };
      tem_acesso: { Args: { p_empresa_id: string }; Returns: boolean };
      tem_papel: {
        Args: { p_empresa_id: string; p_papeis: Database['public']['Enums']['papel'][] };
        Returns: boolean;
      };
    };
    Enums: {
      papel: 'admin' | 'dono' | 'operador' | 'leitor';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      papel: ['admin', 'dono', 'operador', 'leitor'],
    },
  },
} as const;
