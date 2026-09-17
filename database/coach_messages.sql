-- Voice coach chat history, one row per turn. Run once in the Supabase SQL editor.
create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_coach_messages_patient on coach_messages(patient_id, created_at desc);
alter table coach_messages enable row level security;
create policy "App can use coach_messages" on coach_messages for all using (true) with check (true);
