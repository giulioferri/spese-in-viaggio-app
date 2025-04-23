

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

-- Create storage bucket for expense photos
insert into storage.buckets (id, name, public)
values ('expense_photos', 'expense_photos', true)
on conflict (id) do nothing;

-- Enable access to the expense_photos bucket based on user auth
create policy "Users can access their expense photos"
on storage.objects for all 
using (
  bucket_id = 'expense_photos' AND 
  (storage.foldername(name))[1] IN (
    select location from public.trips where user_id = auth.uid()
  )
)
with check (
  bucket_id = 'expense_photos' AND 
  (storage.foldername(name))[1] IN (
    select location from public.trips where user_id = auth.uid()
  )
);

