-- Wardrobe TMA — storage bucket for clothing photos
-- Run after 0001_init.sql

-- Private bucket: photos are only reachable via signed URLs or an
-- authenticated client, never a public/anon URL.
insert into storage.buckets (id, name, public)
values ('wardrobe-photos', 'wardrobe-photos', false)
on conflict (id) do nothing;

-- Path convention every client MUST follow: "{auth.uid()}/{item_id}.png".
-- storage.foldername(name) splits the object path on "/" and returns it as
-- an array, so foldername(name)[1] is that leading uid segment.
create policy "wardrobe-photos: select own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "wardrobe-photos: insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "wardrobe-photos: update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "wardrobe-photos: delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wardrobe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
