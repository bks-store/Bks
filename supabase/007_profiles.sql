-- Table profiles : informations personnelles et adresse de livraison par défaut
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  phone       text,
  address     text,
  address2    text,
  city        text,
  zip         text,
  country     text DEFAULT 'FR',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- RLS : chaque utilisateur ne voit et ne modifie que son propre profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();
