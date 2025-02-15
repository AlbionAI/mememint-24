
-- Create a new storage bucket for token logos
insert into storage.buckets (id, name)
values ('token-logos', 'token-logos');

-- Set up RLS policy to allow public read access
create policy "Token logos are publicly accessible"
on storage.objects for select
to public
using ( bucket_id = 'token-logos' );

-- Set up RLS policy to allow authenticated users to upload logos
create policy "Anyone can upload token logos"
on storage.objects for insert
to public
using ( bucket_id = 'token-logos' );
