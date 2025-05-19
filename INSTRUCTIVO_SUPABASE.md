## Instructivo de Integración con Supabase
### Red Viento Sur

Este instructivo te guiará paso a paso en la configuración e integración de Supabase con Red Viento Sur.

#### 1. Crear Proyecto en Supabase

1. Visita [https://supabase.com](https://supabase.com) y inicia sesión
2. Haz clic en "New Project"
3. Completa la información del proyecto:
   - Nombre: "red-viento-sur"
   - Base de datos: Genera una contraseña segura
   - Región: Selecciona la más cercana a tus usuarios
4. Espera a que el proyecto se cree (aproximadamente 1 minuto)

#### 2. Configurar Variables de Entorno

1. En el dashboard de Supabase, ve a Settings > API
2. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
VITE_SUPABASE_URL=tu_url_de_proyecto
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

#### 3. Ejecutar Migraciones

1. En el dashboard de Supabase, ve a SQL Editor
2. Copia y pega el contenido del archivo `supabase/migrations/initial_schema.sql`
3. Ejecuta el script completo

#### 4. Configurar Autenticación

1. En el dashboard, ve a Authentication > Settings
2. Habilita Email Auth
3. Desactiva temporalmente "Confirm email"
4. Configura el dominio permitido para redirecciones

#### 5. Instalar Dependencias

```bash
npm install @supabase/supabase-js
```

#### 6. Configurar Cliente de Supabase

Crea el archivo `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

#### 7. Generar Tipos TypeScript

1. Instala la CLI de Supabase globalmente:
```bash
npm install -g supabase
```

2. Genera los tipos:
```bash
supabase gen types typescript --project-id tu_project_id > src/lib/database.types.ts
```

#### 8. Actualizar Stores

Modifica los stores (authStore, postStore, eventStore) para usar Supabase en lugar de datos mock:

1. Autenticación:
```typescript
login: async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}
```

2. Publicaciones:
```typescript
fetchPosts: async () => {
  const { data, error } = await supabase
    .from('publicaciones')
    .select(`
      *,
      autor:usuarios(*),
      comentarios(*),
      reacciones(*)
    `)
    .order('creado_en', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

#### 9. Implementar Storage

1. En el dashboard, ve a Storage
2. Crea buckets para:
   - avatars
   - event-images
   - post-media

#### 10. Pruebas

1. Crea un usuario de prueba
2. Verifica la autenticación
3. Prueba la creación de publicaciones
4. Confirma que RLS está funcionando correctamente

#### Notas Importantes

- Mantén seguros tus tokens y claves
- Nunca expongas la `service_role_key`
- Usa siempre tipos TypeScript generados
- Implementa manejo de errores robusto
- Prueba las políticas RLS exhaustivamente

#### Comandos Útiles

Refrescar tipos TypeScript:
```bash
supabase gen types typescript --project-id tu_project_id > src/lib/database.types.ts
```

Verificar estado del proyecto:
```bash
supabase status
```

#### Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Auth](https://supabase.com/docs/guides/auth)
- [Guía de Storage](https://supabase.com/docs/guides/storage)
- [Ejemplos de RLS](https://supabase.com/docs/guides/auth/row-level-security)