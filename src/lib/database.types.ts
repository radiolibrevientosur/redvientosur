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
      artistas: {
        Row: {
          actualizado_en: string | null
          agregado_por: string | null
          biografia: string | null
          contacto: Json | null
          creado_en: string | null
          disciplina: string[] | null
          id: string
          imagen_url: string | null
          nombre: string
          redes_sociales: Json | null
        }
        Insert: {
          actualizado_en?: string | null
          agregado_por?: string | null
          biografia?: string | null
          contacto?: Json | null
          creado_en?: string | null
          disciplina?: string[] | null
          id?: string
          imagen_url?: string | null
          nombre: string
          redes_sociales?: Json | null
        }
        Update: {
          actualizado_en?: string | null
          agregado_por?: string | null
          biografia?: string | null
          contacto?: Json | null
          creado_en?: string | null
          disciplina?: string[] | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          redes_sociales?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "artistas_agregado_por_fkey"
            columns: ["agregado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          actualizado_en: string | null
          autor_id: string | null
          contenido: string
          creado_en: string | null
          id: string
          publicacion_id: string | null
        }
        Insert: {
          actualizado_en?: string | null
          autor_id?: string | null
          contenido: string
          creado_en?: string | null
          id?: string
          publicacion_id?: string | null
        }
        Update: {
          actualizado_en?: string | null
          autor_id?: string | null
          contenido?: string
          creado_en?: string | null
          id?: string
          publicacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      contenido_etiquetas: {
        Row: {
          creado_en: string | null
          etiqueta_id: string | null
          evento_id: string | null
          id: string
          publicacion_id: string | null
        }
        Insert: {
          creado_en?: string | null
          etiqueta_id?: string | null
          evento_id?: string | null
          id?: string
          publicacion_id?: string | null
        }
        Update: {
          creado_en?: string | null
          etiqueta_id?: string | null
          evento_id?: string | null
          id?: string
          publicacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contenido_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_etiquetas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_etiquetas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      etiquetas: {
        Row: {
          creado_en: string | null
          id: string
          nombre: string
        }
        Insert: {
          creado_en?: string | null
          id?: string
          nombre: string
        }
        Update: {
          creado_en?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          actualizado_en: string | null
          capacidad: number | null
          categoria: string | null
          creado_en: string | null
          creador_id: string | null
          descripcion: string | null
          direccion: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          imagen_url: string | null
          precio: number | null
          tipo: string
          titulo: string
          ubicacion: string | null
        }
        Insert: {
          actualizado_en?: string | null
          capacidad?: number | null
          categoria?: string | null
          creado_en?: string | null
          creador_id?: string | null
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          imagen_url?: string | null
          precio?: number | null
          tipo: string
          titulo: string
          ubicacion?: string | null
        }
        Update: {
          actualizado_en?: string | null
          capacidad?: number | null
          categoria?: string | null
          creado_en?: string | null
          creador_id?: string | null
          descripcion?: string | null
          direccion?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          imagen_url?: string | null
          precio?: number | null
          tipo?: string
          titulo?: string
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          creado_en: string | null
          id: string
          publicacion_id: string | null
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string | null
          id?: string
          publicacion_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string | null
          id?: string
          publicacion_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          actualizado_en: string | null
          areas_interes: string[] | null
          biografia: string | null
          creado_en: string | null
          id: string
          redes_sociales: Json | null
          sitio_web: string | null
          ubicacion: string | null
          usuario_id: string | null
        }
        Insert: {
          actualizado_en?: string | null
          areas_interes?: string[] | null
          biografia?: string | null
          creado_en?: string | null
          id?: string
          redes_sociales?: Json | null
          sitio_web?: string | null
          ubicacion?: string | null
          usuario_id?: string | null
        }
        Update: {
          actualizado_en?: string | null
          areas_interes?: string[] | null
          biografia?: string | null
          creado_en?: string | null
          id?: string
          redes_sociales?: Json | null
          sitio_web?: string | null
          ubicacion?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones: {
        Row: {
          actualizado_en: string | null
          artista_id: string | null
          autor_id: string | null
          contenido: string | null
          creado_en: string | null
          evento_id: string | null
          id: string
          multimedia_url: string[] | null
          tipo: string
        }
        Insert: {
          actualizado_en?: string | null
          artista_id?: string | null
          autor_id?: string | null
          contenido?: string | null
          creado_en?: string | null
          evento_id?: string | null
          id?: string
          multimedia_url?: string[] | null
          tipo: string
        }
        Update: {
          actualizado_en?: string | null
          artista_id?: string | null
          autor_id?: string | null
          contenido?: string | null
          creado_en?: string | null
          evento_id?: string | null
          id?: string
          multimedia_url?: string[] | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      reacciones: {
        Row: {
          creado_en: string | null
          id: string
          publicacion_id: string | null
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string | null
          id?: string
          publicacion_id?: string | null
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string | null
          id?: string
          publicacion_id?: string | null
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reacciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          actualizado_en: string | null
          avatar_url: string | null
          creado_en: string | null
          id: string
          nombre_completo: string
          nombre_usuario: string
          rol: string
          verificado: boolean | null
        }
        Insert: {
          actualizado_en?: string | null
          avatar_url?: string | null
          creado_en?: string | null
          id: string
          nombre_completo: string
          nombre_usuario: string
          rol?: string
          verificado?: boolean | null
        }
        Update: {
          actualizado_en?: string | null
          avatar_url?: string | null
          creado_en?: string | null
          id?: string
          nombre_completo?: string
          nombre_usuario?: string
          rol?: string
          verificado?: boolean | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
