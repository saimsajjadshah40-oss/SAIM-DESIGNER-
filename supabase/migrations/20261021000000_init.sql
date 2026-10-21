-- ═══════════════════════════════════════════════════════════════════════════
-- SAIM DESIGNER — initial schema
-- Tables, constraints, indexes, Row Level Security, storage bucket + policies,
-- login rate limiting, and seed content.
--
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- Safe to read top-to-bottom: every write path is gated by public.is_admin().
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 0. Helpers
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Admin authorisation (kept separate from any public profile data)
--    There are NO insert/update/delete policies on this table, so no signed-in
--    user can ever grant themselves admin rights through the API. Admins are
--    added only from the Supabase SQL editor (see README).
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read their own admin row" on public.admin_users;
create policy "Admins can read their own admin row"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Public designer profile (single row)
--    profile_image_url stores a storage object path, e.g. "site/portrait.png".
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  smallint primary key default 1 check (id = 1),
  display_name        text not null default 'Saim Sajjad'
                        check (char_length(display_name) between 1 and 80),
  professional_title  text not null default 'Graphic Designer'
                        check (char_length(professional_title) between 1 and 120),
  experience          text not null default '3–4 Years'
                        check (char_length(experience) between 1 and 40),
  experience_caption  text not null default 'Graphic Design Experience'
                        check (char_length(experience_caption) <= 80),
  about_text          text not null default ''
                        check (char_length(about_text) <= 5000),
  skills              text[] not null default '{}'
                        check (cardinality(skills) <= 30),
  profile_image_url   text check (profile_image_url is null or char_length(profile_image_url) <= 500),
  profile_image_alt   text check (profile_image_alt is null or char_length(profile_image_alt) <= 200),
  updated_at          timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Profile is public" on public.profiles;
create policy "Profile is public"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins update profile" on public.profiles;
create policy "Admins update profile"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins insert profile" on public.profiles;
create policy "Admins insert profile"
  on public.profiles for insert
  to authenticated
  with check ((select public.is_admin()));

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Portfolio projects
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.portfolio_projects (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 1 and 140),
  slug           text not null unique
                   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  category       text not null check (category in ('logo', 'banner', 'thumbnail')),
  subcategory    text check (subcategory is null or char_length(subcategory) <= 60),
  description    text not null default '' check (char_length(description) <= 3000),
  cover_image    text check (cover_image is null or char_length(cover_image) <= 500),
  cover_alt      text check (cover_alt is null or char_length(cover_alt) <= 300),
  cover_width    integer check (cover_width is null or cover_width between 1 and 20000),
  cover_height   integer check (cover_height is null or cover_height between 1 and 20000),
  client_name    text check (client_name is null or char_length(client_name) <= 120),
  is_featured    boolean not null default false,
  is_published   boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists portfolio_projects_public_idx
  on public.portfolio_projects (category, is_published, display_order);
create index if not exists portfolio_projects_updated_idx
  on public.portfolio_projects (updated_at desc);

drop trigger if exists portfolio_projects_updated_at on public.portfolio_projects;
create trigger portfolio_projects_updated_at before update on public.portfolio_projects
  for each row execute function public.set_updated_at();

alter table public.portfolio_projects enable row level security;

drop policy if exists "Published projects are public" on public.portfolio_projects;
create policy "Published projects are public"
  on public.portfolio_projects for select
  to anon, authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "Admins insert projects" on public.portfolio_projects;
create policy "Admins insert projects"
  on public.portfolio_projects for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins update projects" on public.portfolio_projects;
create policy "Admins update projects"
  on public.portfolio_projects for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins delete projects" on public.portfolio_projects;
create policy "Admins delete projects"
  on public.portfolio_projects for delete
  to authenticated
  using ((select public.is_admin()));

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Additional project images
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.project_images (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.portfolio_projects (id) on delete cascade,
  image_path     text not null check (char_length(image_path) <= 500),
  alt_text       text not null default '' check (char_length(alt_text) <= 300),
  width          integer check (width is null or width between 1 and 20000),
  height         integer check (height is null or height between 1 and 20000),
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists project_images_project_idx
  on public.project_images (project_id, display_order);

alter table public.project_images enable row level security;

drop policy if exists "Images of published projects are public" on public.project_images;
create policy "Images of published projects are public"
  on public.project_images for select
  to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.portfolio_projects p
      where p.id = project_images.project_id and p.is_published
    )
  );

drop policy if exists "Admins insert images" on public.project_images;
create policy "Admins insert images"
  on public.project_images for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins update images" on public.project_images;
create policy "Admins update images"
  on public.project_images for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins delete images" on public.project_images;
create policy "Admins delete images"
  on public.project_images for delete
  to authenticated
  using ((select public.is_admin()));

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Website settings (key → JSON value)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.website_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  value       jsonb not null default '{}'::jsonb,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

drop trigger if exists website_settings_updated_at on public.website_settings;
create trigger website_settings_updated_at before update on public.website_settings
  for each row execute function public.set_updated_at();

alter table public.website_settings enable row level security;

drop policy if exists "Public settings are readable" on public.website_settings;
create policy "Public settings are readable"
  on public.website_settings for select
  to anon, authenticated
  using (is_public or (select public.is_admin()));

drop policy if exists "Admins insert settings" on public.website_settings;
create policy "Admins insert settings"
  on public.website_settings for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins update settings" on public.website_settings;
create policy "Admins update settings"
  on public.website_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Social links
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.social_links (
  id             uuid primary key default gen_random_uuid(),
  platform       text not null unique
                   check (platform in ('instagram', 'facebook', 'behance', 'dribbble', 'linkedin', 'youtube')),
  url            text check (url is null or (url ~ '^https://[^\s]+$' and char_length(url) <= 300)),
  is_visible     boolean not null default false,
  display_order  integer not null default 0,
  updated_at     timestamptz not null default now(),
  -- a link can only be shown if it actually has a URL
  constraint social_links_visible_needs_url check (not is_visible or url is not null)
);

drop trigger if exists social_links_updated_at on public.social_links;
create trigger social_links_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();

alter table public.social_links enable row level security;

drop policy if exists "Visible social links are public" on public.social_links;
create policy "Visible social links are public"
  on public.social_links for select
  to anon, authenticated
  using (is_visible or (select public.is_admin()));

drop policy if exists "Admins update social links" on public.social_links;
create policy "Admins update social links"
  on public.social_links for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Login rate limiting
--    Table is unreachable through the API (RLS on, no policies). The only way
--    in is the SECURITY DEFINER function below, which allows 5 attempts per
--    salted key per 15 minutes. Keys are SHA-256 hashes computed server-side.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.login_attempts (
  id            bigint generated always as identity primary key,
  key_hash      text not null,
  attempted_at  timestamptz not null default now()
);

create index if not exists login_attempts_key_idx
  on public.login_attempts (key_hash, attempted_at desc);

alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

create or replace function public.register_login_attempt(p_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_key is null or p_key !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  delete from public.login_attempts where attempted_at < now() - interval '1 day';

  select count(*) into v_count
  from public.login_attempts
  where key_hash = p_key
    and attempted_at > now() - interval '15 minutes';

  if v_count >= 5 then
    return false;
  end if;

  insert into public.login_attempts (key_hash) values (p_key);
  return true;
end;
$$;

revoke all on function public.register_login_attempt(text) from public;
grant execute on function public.register_login_attempt(text) to anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 8. Table privileges (RLS still decides which rows)
-- ───────────────────────────────────────────────────────────────────────────
grant select on public.profiles, public.portfolio_projects, public.project_images,
                public.website_settings, public.social_links
  to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.portfolio_projects, public.project_images to authenticated;
grant insert, update on public.website_settings to authenticated;
grant update on public.social_links to authenticated;
grant select on public.admin_users to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 9. Storage — private bucket, served only through /api/media
--    Folder layout:
--      site/<file>                     → public site assets (portrait, OG image)
--      projects/<project_id>/<file>    → readable only while that project is published
-- ───────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio media read" on storage.objects;
create policy "Portfolio media read"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'portfolio'
    and (
      (select public.is_admin())
      or (storage.foldername(name))[1] = 'site'
      or (
        (storage.foldername(name))[1] = 'projects'
        and exists (
          select 1 from public.portfolio_projects p
          where p.id::text = (storage.foldername(name))[2]
            and p.is_published
        )
      )
    )
  );

drop policy if exists "Portfolio media admin insert" on storage.objects;
create policy "Portfolio media admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio' and (select public.is_admin()));

drop policy if exists "Portfolio media admin update" on storage.objects;
create policy "Portfolio media admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio' and (select public.is_admin()))
  with check (bucket_id = 'portfolio' and (select public.is_admin()));

drop policy if exists "Portfolio media admin delete" on storage.objects;
create policy "Portfolio media admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio' and (select public.is_admin()));

-- ───────────────────────────────────────────────────────────────────────────
-- 10. Seed content (real information only — no invented projects or clients)
-- ───────────────────────────────────────────────────────────────────────────
insert into public.profiles (id, display_name, professional_title, experience, experience_caption, about_text, skills)
values (
  1,
  'Saim Sajjad',
  'Creative Graphic Designer',
  '3–4 Years',
  'Graphic Design Experience',
  E'I''m Saim Sajjad, a professional graphic designer with 3–4 years of experience creating visually impactful designs for businesses, brands, and digital platforms.\n\nDuring my creative journey, I have worked with different companies and professional teams, including Pixely Careers, contributing to a variety of professional design projects.\n\nMy expertise includes logo design, branding, banner design, YouTube thumbnails, and social media graphics.\n\nI focus on creating visually engaging, professional designs that communicate the right message and help brands establish a stronger identity.',
  array['Adobe Photoshop', 'Adobe Illustrator', 'Logo Design', 'Brand Identity', 'Banner Design', 'YouTube Thumbnails', 'Social Media Design', 'Visual Communication']
)
on conflict (id) do nothing;

insert into public.website_settings (key, value) values
('hero', jsonb_build_object(
  'intro', 'Hello, I''m',
  'name', 'Saim Sajjad',
  'title', 'Creative Graphic Designer',
  'roles', jsonb_build_array('Graphic Designer', 'Brand Identity Designer', 'Logo Design Specialist', 'YouTube Thumbnail Designer', 'Creative Visual Designer'),
  'description', 'Transforming creative ideas into powerful visual designs that help brands stand out.',
  'primaryLabel', 'Explore My Work',
  'secondaryLabel', 'Hire Me',
  'marquee', jsonb_build_array('Logos', 'Branding', 'Banners', 'Thumbnails', 'Social Media')
)),
('about', jsonb_build_object(
  'heading', 'About Me',
  'subheading', 'Creativity Meets Professional Design'
)),
('portfolio', jsonb_build_object(
  'logo', jsonb_build_object(
    'heading', 'Logo Design Portfolio',
    'description', 'Explore professionally crafted logo designs that combine creativity, originality, and meaningful brand identity.',
    'cta', 'Request a Logo Design'),
  'banner', jsonb_build_object(
    'heading', 'Professional Banner Designs',
    'description', 'Creative banner designs built to communicate powerful brand messages and capture attention.',
    'cta', 'Get Your Banner Designed'),
  'thumbnail', jsonb_build_object(
    'heading', 'YouTube Thumbnail Designs',
    'description', 'Eye-catching thumbnails designed to communicate video topics clearly and make content visually memorable.',
    'cta', 'Request a Thumbnail'),
  'bannerCategories', jsonb_build_array('Social Media Banners', 'Advertising Banners', 'Website Banners', 'Promotional Banners')
)),
('contact', jsonb_build_object(
  'whatsapp', '923228037525',
  'heading', 'Let''s Work Together',
  'description', 'Have a creative project in mind? Let''s turn your ideas into something remarkable.'
)),
('seo', jsonb_build_object(
  'title', 'Saim Sajjad — Graphic Designer | SAIM DESIGNER',
  'description', 'Portfolio of Saim Sajjad, a graphic designer from Pakistan with 3–4 years of experience in logo design, brand identity, banner design and YouTube thumbnails.',
  'ogImage', null
)),
('footer', jsonb_build_object(
  'tagline', 'Turning Creative Ideas Into Powerful Visual Experiences.'
))
on conflict (key) do nothing;

insert into public.social_links (platform, display_order) values
  ('instagram', 1), ('facebook', 2), ('behance', 3),
  ('dribbble', 4), ('linkedin', 5), ('youtube', 6)
on conflict (platform) do nothing;
