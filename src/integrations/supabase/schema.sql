
-- Create profiles table for storing user profiles
create table if not exists public.profiles (
  id text primary key,
  photo text,
  palette text not null default 'default',
  updated_at timestamp with time zone default now()
);

-- Create storage bucket for profile photos
insert into storage.buckets (id, name, public)
values ('profile_photos', 'profile_photos', true)
on conflict (id) do nothing;

-- Enable public access to the bucket
create policy "Public Access to profile_photos"
on storage.objects for all
using (bucket_id = 'profile_photos')
with check (bucket_id = 'profile_photos');
