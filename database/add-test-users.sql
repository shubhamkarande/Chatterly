-- Add test users to Supabase for development
-- Note: In production, users should register through the app

-- Insert test users into profiles table
-- Make sure to replace these UUIDs with actual user IDs from your auth.users table

INSERT INTO public.profiles (id, email, display_name, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com', 'Alice Johnson', 'https://i.pravatar.cc/150?img=1'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com', 'Bob Smith', 'https://i.pravatar.cc/150?img=2'),
  ('33333333-3333-3333-3333-333333333333', 'charlie@example.com', 'Charlie Brown', 'https://i.pravatar.cc/150?img=3'),
  ('44444444-4444-4444-4444-444444444444', 'diana@example.com', 'Diana Prince', 'https://i.pravatar.cc/150?img=4'),
  ('55555555-5555-5555-5555-555555555555', 'eve@example.com', 'Eve Wilson', 'https://i.pravatar.cc/150?img=5')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- Create a test group chat
INSERT INTO public.chats (id, name, is_group, created_by) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Team Chat', true, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Add participants to the group chat
INSERT INTO public.chat_participants (chat_id, user_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (chat_id, user_id) DO NOTHING;

-- Add some test messages
INSERT INTO public.messages (chat_id, sender_id, content) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Hello everyone! Welcome to our team chat.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Hi Alice! Thanks for setting this up.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Great to be here! Looking forward to collaborating.');