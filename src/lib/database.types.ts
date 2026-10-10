export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      anotacoes: {
        Row: {
          created_at: string;
          created_by: string | null;
          empresa_id: string;
          id: string;
          texto: string;
          updated_at: string;
          visivel_para_empresa: boolean;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          empresa_id: string;
          id?: string;
          texto: string;
          updated_at?: string;
          visivel_para_empresa?: boolean;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          empresa_id?: string;
          id?: string;
          texto?: string;
          updated_at?: string;
          visivel_para_empresa?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'anotacoes_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
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
      configuracao_plataforma: {
        Row: {
          exigir_segundo_fator: boolean;
          id: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          exigir_segundo_fator?: boolean;
          id?: boolean;
          updated_at?: string;
        };
        Update: {
          exigir_segundo_fator?: boolean;
          id?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      empresas: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          nome: string;
          setor: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          nome: string;
          setor?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          nome?: string;
          setor?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      entradas_diarias: {
        Row: {
          created_at: string;
          created_by: string | null;
          data: string;
          deleted_at: string | null;
          empresa_id: string;
          forma_id: string;
          id: string;
          updated_at: string;
          valor: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          data: string;
          deleted_at?: string | null;
          empresa_id: string;
          forma_id: string;
          id?: string;
          updated_at?: string;
          valor: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          data?: string;
          deleted_at?: string | null;
          empresa_id?: string;
          forma_id?: string;
          id?: string;
          updated_at?: string;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'entradas_diarias_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'entradas_diarias_forma_id_empresa_id_fkey';
            columns: ['forma_id', 'empresa_id'];
            isOneToOne: false;
            referencedRelation: 'formas_recebimento';
            referencedColumns: ['id', 'empresa_id'];
          },
        ];
      };
      faturamento_ano_anterior: {
        Row: {
          ano: number;
          created_at: string;
          created_by: string | null;
          empresa_id: string;
          id: string;
          mes: number;
          updated_at: string;
          valor: number;
        };
        ComputedFields: never;
        Insert: {
          ano: number;
          created_at?: string;
          created_by?: string | null;
          empresa_id: string;
          id?: string;
          mes: number;
          updated_at?: string;
          valor?: number;
        };
        Update: {
          ano?: number;
          created_at?: string;
          created_by?: string | null;
          empresa_id?: string;
          id?: string;
          mes?: number;
          updated_at?: string;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'faturamento_ano_anterior_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      formas_recebimento: {
        Row: {
          ativa: boolean;
          conta_faturamento: boolean;
          created_at: string;
          created_by: string | null;
          destino: Database['public']['Enums']['destino_recebimento'];
          eh_crediario: boolean;
          empresa_id: string;
          id: string;
          nome: string;
          ordem: number;
          padrao: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ativa?: boolean;
          conta_faturamento?: boolean;
          created_at?: string;
          created_by?: string | null;
          destino: Database['public']['Enums']['destino_recebimento'];
          eh_crediario?: boolean;
          empresa_id: string;
          id?: string;
          nome: string;
          ordem?: number;
          padrao?: boolean;
          updated_at?: string;
        };
        Update: {
          ativa?: boolean;
          conta_faturamento?: boolean;
          created_at?: string;
          created_by?: string | null;
          destino?: Database['public']['Enums']['destino_recebimento'];
          eh_crediario?: boolean;
          empresa_id?: string;
          id?: string;
          nome?: string;
          ordem?: number;
          padrao?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'formas_recebimento_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      indicadores_diarios: {
        Row: {
          created_at: string;
          created_by: string | null;
          data: string;
          deleted_at: string | null;
          descontos: number;
          empresa_id: string;
          id: string;
          qtd_produtos: number;
          qtd_vendas: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          data: string;
          deleted_at?: string | null;
          descontos?: number;
          empresa_id: string;
          id?: string;
          qtd_produtos?: number;
          qtd_vendas?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          data?: string;
          deleted_at?: string | null;
          descontos?: number;
          empresa_id?: string;
          id?: string;
          qtd_produtos?: number;
          qtd_vendas?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'indicadores_diarios_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      limites_de_taxa: {
        Row: {
          chave: string;
          contagem: number;
          janela_inicio: string;
        };
        ComputedFields: never;
        Insert: {
          chave: string;
          contagem: number;
          janela_inicio: string;
        };
        Update: {
          chave?: string;
          contagem?: number;
          janela_inicio?: string;
        };
        Relationships: [];
      };
      meses_fechados: {
        Row: {
          ano: number;
          created_at: string;
          created_by: string | null;
          empresa_id: string;
          id: string;
          mes: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ano: number;
          created_at?: string;
          created_by?: string | null;
          empresa_id: string;
          id?: string;
          mes: number;
          updated_at?: string;
        };
        Update: {
          ano?: number;
          created_at?: string;
          created_by?: string | null;
          empresa_id?: string;
          id?: string;
          mes?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meses_fechados_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      metas_anuais: {
        Row: {
          ano: number;
          created_at: string;
          created_by: string | null;
          crescimento_desejado: number;
          empresa_id: string;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ano: number;
          created_at?: string;
          created_by?: string | null;
          crescimento_desejado?: number;
          empresa_id: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          ano?: number;
          created_at?: string;
          created_by?: string | null;
          crescimento_desejado?: number;
          empresa_id?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'metas_anuais_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      movimentacoes: {
        Row: {
          caixa: Database['public']['Enums']['caixa'];
          conta_id: string | null;
          created_at: string;
          created_by: string | null;
          data: string;
          deleted_at: string | null;
          descricao: string;
          empresa_id: string;
          id: string;
          origem: Database['public']['Enums']['origem_entrada'] | null;
          tipo: Database['public']['Enums']['tipo_movimentacao'];
          updated_at: string;
          valor: number;
        };
        ComputedFields: never;
        Insert: {
          caixa: Database['public']['Enums']['caixa'];
          conta_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          data: string;
          deleted_at?: string | null;
          descricao?: string;
          empresa_id: string;
          id?: string;
          origem?: Database['public']['Enums']['origem_entrada'] | null;
          tipo: Database['public']['Enums']['tipo_movimentacao'];
          updated_at?: string;
          valor: number;
        };
        Update: {
          caixa?: Database['public']['Enums']['caixa'];
          conta_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          data?: string;
          deleted_at?: string | null;
          descricao?: string;
          empresa_id?: string;
          id?: string;
          origem?: Database['public']['Enums']['origem_entrada'] | null;
          tipo?: Database['public']['Enums']['tipo_movimentacao'];
          updated_at?: string;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'movimentacoes_conta_id_empresa_id_fkey';
            columns: ['conta_id', 'empresa_id'];
            isOneToOne: false;
            referencedRelation: 'plano_contas';
            referencedColumns: ['id', 'empresa_id'];
          },
          {
            foreignKeyName: 'movimentacoes_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      parametros_markup: {
        Row: {
          ano: number;
          comissao: number;
          created_at: string;
          created_by: string | null;
          despesa_fixa: number;
          empresa_id: string;
          id: string;
          imposto: number;
          investimentos: number;
          margem_lucro: number;
          mes: number;
          taxa_cartao: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ano: number;
          comissao?: number;
          created_at?: string;
          created_by?: string | null;
          despesa_fixa?: number;
          empresa_id: string;
          id?: string;
          imposto?: number;
          investimentos?: number;
          margem_lucro?: number;
          mes: number;
          taxa_cartao?: number;
          updated_at?: string;
        };
        Update: {
          ano?: number;
          comissao?: number;
          created_at?: string;
          created_by?: string | null;
          despesa_fixa?: number;
          empresa_id?: string;
          id?: string;
          imposto?: number;
          investimentos?: number;
          margem_lucro?: number;
          mes?: number;
          taxa_cartao?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'parametros_markup_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      parametros_mes: {
        Row: {
          ano: number;
          created_at: string;
          created_by: string | null;
          dias_previstos: number;
          empresa_id: string;
          id: string;
          mes: number;
          meta_faturamento: number;
          taxa_credito: number;
          taxa_debito: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ano: number;
          created_at?: string;
          created_by?: string | null;
          dias_previstos?: number;
          empresa_id: string;
          id?: string;
          mes: number;
          meta_faturamento?: number;
          taxa_credito?: number;
          taxa_debito?: number;
          updated_at?: string;
        };
        Update: {
          ano?: number;
          created_at?: string;
          created_by?: string | null;
          dias_previstos?: number;
          empresa_id?: string;
          id?: string;
          mes?: number;
          meta_faturamento?: number;
          taxa_credito?: number;
          taxa_debito?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'parametros_mes_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      plano_contas: {
        Row: {
          ativa: boolean;
          created_at: string;
          created_by: string | null;
          eh_despesa_financeira: boolean;
          eh_pro_labore: boolean;
          empresa_id: string;
          grupo: Database['public']['Enums']['grupo_conta'];
          id: string;
          nome: string;
          ordem: number;
          padrao: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ativa?: boolean;
          created_at?: string;
          created_by?: string | null;
          eh_despesa_financeira?: boolean;
          eh_pro_labore?: boolean;
          empresa_id: string;
          grupo: Database['public']['Enums']['grupo_conta'];
          id?: string;
          nome: string;
          ordem?: number;
          padrao?: boolean;
          updated_at?: string;
        };
        Update: {
          ativa?: boolean;
          created_at?: string;
          created_by?: string | null;
          eh_despesa_financeira?: boolean;
          eh_pro_labore?: boolean;
          empresa_id?: string;
          grupo?: Database['public']['Enums']['grupo_conta'];
          id?: string;
          nome?: string;
          ordem?: number;
          padrao?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plano_contas_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      produtos_preco: {
        Row: {
          ano: number;
          created_at: string;
          created_by: string | null;
          custo: number;
          embalagem: number;
          empresa_id: string;
          frete: number;
          id: string;
          imposto_entrada: number;
          mes: number;
          nome: string;
          preco_concorrente: number | null;
          preco_trabalhado: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ano: number;
          created_at?: string;
          created_by?: string | null;
          custo?: number;
          embalagem?: number;
          empresa_id: string;
          frete?: number;
          id?: string;
          imposto_entrada?: number;
          mes: number;
          nome: string;
          preco_concorrente?: number | null;
          preco_trabalhado?: number | null;
          updated_at?: string;
        };
        Update: {
          ano?: number;
          created_at?: string;
          created_by?: string | null;
          custo?: number;
          embalagem?: number;
          empresa_id?: string;
          frete?: number;
          id?: string;
          imposto_entrada?: number;
          mes?: number;
          nome?: string;
          preco_concorrente?: number | null;
          preco_trabalhado?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'produtos_preco_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: false;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
      };
      saldos_iniciais: {
        Row: {
          created_at: string;
          created_by: string | null;
          data_inicio: string;
          empresa_id: string;
          id: string;
          saldo_banco: number;
          saldo_dinheiro: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          data_inicio: string;
          empresa_id: string;
          id?: string;
          saldo_banco?: number;
          saldo_dinheiro?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          data_inicio?: string;
          empresa_id?: string;
          id?: string;
          saldo_banco?: number;
          saldo_dinheiro?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saldos_iniciais_empresa_id_fkey';
            columns: ['empresa_id'];
            isOneToOne: true;
            referencedRelation: 'empresas';
            referencedColumns: ['id'];
          },
        ];
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
      alterar_vinculo: {
        Args: { p_papel: Database['public']['Enums']['papel']; p_vinculo_id: string };
        Returns: undefined;
      };
      compartilha_empresa: { Args: { p_usuario_id: string }; Returns: boolean };
      consumir_limite: {
        Args: { p_chave: string; p_janela_segundos: number; p_maximo: number };
        Returns: boolean;
      };
      criar_empresa: { Args: { p_nome: string }; Returns: string };
      eh_admin_plataforma: { Args: Record<PropertyKey, never>; Returns: boolean };
      excluindo_empresa: { Args: { p_empresa_id: string }; Returns: boolean };
      excluir_empresa: { Args: { p_confirmacao: string; p_empresa_id: string }; Returns: string[] };
      mes_fechado: {
        Args: { p_ano: number; p_empresa_id: string; p_mes: number };
        Returns: boolean;
      };
      mfa_ok: { Args: Record<PropertyKey, never>; Returns: boolean };
      painel_empresas: {
        Args: { p_ano: number; p_mes: number };
        Returns: {
          dias_lancados_mes: number;
          dias_previstos: number;
          empresa_id: string;
          entradas_banco: number;
          entradas_dinheiro: number;
          faturamento_mes: number;
          margem_lucro: number;
          meta_faturamento: number;
          movimento_banco: number;
          movimento_dinheiro: number;
          nome: string;
          pro_labore_mes: number;
          saidas_mes: number;
          saldo_inicial_banco: number;
          saldo_inicial_dinheiro: number;
          setor: string;
          taxas_cartao: number;
          taxas_cartao_mes: number;
          ultimo_lancamento: string;
        }[];
      };
      pode_convidar: { Args: { p_empresa_id: string }; Returns: boolean };
      precisa_mfa: { Args: Record<PropertyKey, never>; Returns: boolean };
      remover_vinculo: { Args: { p_vinculo_id: string }; Returns: undefined };
      semear_cadastros_padrao: { Args: { p_empresa_id: string }; Returns: undefined };
      tem_acesso: { Args: { p_empresa_id: string }; Returns: boolean };
      tem_papel: {
        Args: { p_empresa_id: string; p_papeis: Database['public']['Enums']['papel'][] };
        Returns: boolean;
      };
      vincular_por_email: {
        Args: {
          p_email: string;
          p_empresa_id: string;
          p_papel: Database['public']['Enums']['papel'];
        };
        Returns: string;
      };
    };
    Enums: {
      caixa: 'dinheiro' | 'banco';
      destino_recebimento: 'dinheiro' | 'banco' | 'cartao_debito' | 'cartao_credito' | 'nenhum';
      grupo_conta: 'fixo' | 'variavel' | 'investimento';
      origem_entrada: 'recebimento_crediario' | 'outro';
      papel: 'admin' | 'dono' | 'operador' | 'leitor';
      tipo_movimentacao: 'saida' | 'entrada' | 'transferencia';
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
      caixa: ['dinheiro', 'banco'],
      destino_recebimento: ['dinheiro', 'banco', 'cartao_debito', 'cartao_credito', 'nenhum'],
      grupo_conta: ['fixo', 'variavel', 'investimento'],
      origem_entrada: ['recebimento_crediario', 'outro'],
      papel: ['admin', 'dono', 'operador', 'leitor'],
      tipo_movimentacao: ['saida', 'entrada', 'transferencia'],
    },
  },
} as const;
