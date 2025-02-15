
-- Create a new storage bucket for token logos
insert into storage.buckets (id, name)
values ('token-logos', 'token-logos');

-- Set up public access for the token-logos bucket
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'token-logos' );

-- Allow authenticated users to upload token logos
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'token-logos' );
