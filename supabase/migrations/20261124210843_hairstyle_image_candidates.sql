alter table public.trending_styles
  add column thumbnail_url text,
  add column image_candidates jsonb not null default '[]'::jsonb,
  add column image_candidates_updated_at timestamptz;

alter table public.trending_styles
  add constraint trending_styles_image_candidates_array
  check (jsonb_typeof(image_candidates) = 'array');