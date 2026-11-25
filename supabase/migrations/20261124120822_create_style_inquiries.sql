create table public.style_inquiries (
  id uuid primary key default gen_random_uuid(),
  style_name text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  message text not null default '',
  source_url text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index style_inquiries_status_created_idx
  on public.style_inquiries (status, created_at desc);

alter table public.style_inquiries enable row level security;

revoke all on table public.style_inquiries from public, anon, authenticated;