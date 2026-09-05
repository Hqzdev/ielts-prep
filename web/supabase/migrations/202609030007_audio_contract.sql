alter table public.audio_assets rename column storage_path to path;
alter table public.audio_assets rename column duration_seconds to duration;
alter table public.audio_assets rename column byte_size to bytes;
alter table public.audio_assets rename column status to state;
alter table public.audio_assets drop constraint audio_assets_duration_seconds_check;
alter table public.audio_assets alter column duration set default 0;
alter table public.audio_assets add constraint audio_duration_state check (duration >= 0 and duration <= 600 and (state <> 'ready' or duration > 0));
alter table public.speech_assets rename column storage_path to path;
