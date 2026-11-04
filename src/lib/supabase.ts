import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Ces variables doivent être définies dans un fichier .env.local à la racine du projet :
// VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
// VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Le client est null en mode démo (sans .env.local).
// Tout le code qui utilise supabase commence par `if (!isConfigured) return`
// donc null ne sera jamais déréférencé sans vérification.
export const supabase = (
  isConfigured ? createClient<Database>(supabaseUrl!, supabaseAnonKey!) : null
) as ReturnType<typeof createClient<Database>>
