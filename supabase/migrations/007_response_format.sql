-- Add response format fields to questions
alter table questions add column if not exists response_type text default 'freetext'
  check (response_type in ('freetext', 'yes_no', 'yes_no_na', 'dropdown', 'multi_select'));
alter table questions add column if not exists response_options text[] default '{}';
alter table questions add column if not exists response_value text;
alter table questions add column if not exists comment text;
alter table questions add column if not exists original_column_headers jsonb default '{}';
