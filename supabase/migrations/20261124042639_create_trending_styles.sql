create table public.trending_styles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  image_url text,
  source_url text,
  google_position integer check (google_position between 1 and 100),
  trend_score integer not null default 0 check (trend_score >= 0),
  updated_at timestamptz not null default now()
);

create index trending_styles_score_updated_idx
  on public.trending_styles (trend_score desc, updated_at desc);

alter table public.trending_styles enable row level security;

create policy "Trending styles are publicly readable"
  on public.trending_styles
  for select
  to anon, authenticated
  using (true);

grant select on table public.trending_styles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.trending_styles
  from anon, authenticated;