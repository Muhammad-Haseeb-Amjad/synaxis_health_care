insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-assets', 'company-assets', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users manage company assets"
on storage.objects for all to authenticated
using (bucket_id = 'company-assets' and auth.role() = 'authenticated')
with check (bucket_id = 'company-assets' and auth.role() = 'authenticated');
