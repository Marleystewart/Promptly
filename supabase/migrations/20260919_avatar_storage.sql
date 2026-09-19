-- Profile photos that follow the account across devices.
--
-- Until now the photo lived only in localStorage, so signing in on a new phone
-- showed an empty circle and students reasonably read that as the app losing
-- their data. This moves it to Storage.
--
-- Why a bucket and not user_metadata: user_metadata is embedded in the access
-- token JWT, and a photo data URL is tens to hundreds of kilobytes. Putting it
-- there would bloat every Authorization header the app sends.
--
-- The bucket is PRIVATE. A public bucket would make every avatar readable by
-- anyone who can guess a UUID, and the user ids are visible to the client that
-- owns them. The app reads photos with an authenticated download, not a URL.
--
-- Path layout is "<user id>/avatar" — one object per account, overwritten on
-- each change, so a student cannot accumulate orphaned images and the policies
-- below can authorize on the first path segment alone.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152, -- 2 MB; the client downscales to 512px before upload, well under this
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Every policy authorizes on the first path segment matching the caller's own
-- id. This is the whole isolation story: without it any signed-in student could
-- read or overwrite another's photo by editing the path.
--
-- The independent pentest on the sibling project found four defects where a
-- control was attached to the wrong object, so these are deliberately written
-- per-operation rather than as one permissive "for all" policy.

drop policy if exists "avatar_select_own" on storage.objects;
create policy "avatar_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deleting your own photo from Profile → remove photo. Account deletion is a
-- separate path: api/subscribe.js removes the object with the service role,
-- because deleting an auth user does NOT cascade to Storage and the photo
-- would otherwise outlive the account it belongs to.
drop policy if exists "avatar_delete_own" on storage.objects;
create policy "avatar_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
