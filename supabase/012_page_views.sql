-- Compteur de visites léger (pas de données personnelles)
create table if not exists page_views (
  id        bigserial primary key,
  path      text not null,
  visited_at timestamptz default now() not null
);

-- Index pour les agrégations admin
create index if not exists page_views_visited_at_idx on page_views (visited_at);
create index if not exists page_views_path_idx on page_views (path);

-- Tout le monde peut insérer (visiteurs anonymes), personne ne peut lire sauf service role
alter table page_views enable row level security;

create policy "insert_anon" on page_views
  for insert to anon, authenticated with check (true);

create policy "select_service" on page_views
  for select using (auth.role() = 'service_role');
