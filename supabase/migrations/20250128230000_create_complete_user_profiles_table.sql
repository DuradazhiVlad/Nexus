-- Create complete user_profiles table with all necessary fields and indexes
create table if not exists public.user_profiles (
   id uuid not null default gen_random_uuid (),
   auth_user_id uuid not null,
   name text not null,
   last_name text null default ''::text,
   email text not null,
   avatar text null,
   bio text null,
   city text null,
   birth_date date null,
   education text null,
   phone text null,
   work text null,
   website text null,
   relationship_status text null,
   hobbies jsonb null default '[]'::jsonb,
   languages jsonb null default '[]'::jsonb,
   notifications jsonb null default '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
   privacy jsonb null default '{"showEmail": false, "showBirthDate": true, "profileVisibility": "public"}'::jsonb,
   created_at timestamp with time zone null default now(),
   updated_at timestamp with time zone null default now(),
   email_verified boolean null default false,
   gender text null,
   looking_for_relationship boolean null default false,
   age integer null,
   constraint user_profiles_pkey primary key (id),
   constraint user_profiles_auth_user_id_key unique (auth_user_id),
   constraint user_profiles_auth_user_id_fkey foreign key (auth_user_id) references auth.users (id) on delete cascade,
   constraint user_profiles_gender_check check (
     (
       (gender is null)
       or (
         gender = any (
           array['male'::text, 'female'::text, 'other'::text]
         )
       )
     )
   )
) tablespace pg_default;

-- Create indexes for better performance
create index if not exists idx_user_profiles_gender on public.user_profiles using btree (gender) tablespace pg_default;
create index if not exists idx_user_profiles_looking_for_relationship on public.user_profiles using btree (looking_for_relationship) tablespace pg_default;
create index if not exists idx_user_profiles_age on public.user_profiles using btree (age) tablespace pg_default;
create index if not exists idx_user_profiles_auth_user_id on public.user_profiles using btree (auth_user_id) tablespace pg_default;
create index if not exists idx_user_profiles_email on public.user_profiles using btree (email) tablespace pg_default;
create index if not exists idx_user_profiles_name on public.user_profiles using btree (name, last_name) tablespace pg_default;
create index if not exists idx_user_profiles_email_verified on public.user_profiles using btree (email_verified) tablespace pg_default;
create index if not exists idx_user_profiles_hobbies on public.user_profiles using gin (hobbies) tablespace pg_default;
create index if not exists idx_user_profiles_languages on public.user_profiles using gin (languages) tablespace pg_default;
create index if not exists idx_user_profiles_education on public.user_profiles using btree (education) tablespace pg_default;
create index if not exists idx_user_profiles_work on public.user_profiles using btree (work) tablespace pg_default;
create index if not exists idx_user_profiles_relationship_status on public.user_profiles using btree (relationship_status) tablespace pg_default;

-- Create function for updating updated_at column if it doesn't exist
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updating updated_at column
drop trigger if exists update_user_profiles_updated_at on user_profiles;
create trigger update_user_profiles_updated_at
    before update on user_profiles
    for each row
    execute function update_updated_at_column();

-- Enable RLS (Row Level Security)
alter table public.user_profiles enable row level security;

-- Create RLS policies
create policy "Users can view their own profile" on public.user_profiles
    for select using (auth.uid() = auth_user_id);

create policy "Users can update their own profile" on public.user_profiles
    for update using (auth.uid() = auth_user_id);

create policy "Users can insert their own profile" on public.user_profiles
    for insert with check (auth.uid() = auth_user_id);

create policy "Users can delete their own profile" on public.user_profiles
    for delete using (auth.uid() = auth_user_id);

-- Allow public profiles to be viewed by anyone
create policy "Public profiles are viewable by everyone" on public.user_profiles
    for select using (
        (privacy->>'profileVisibility')::text = 'public'
    );

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.user_profiles to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;