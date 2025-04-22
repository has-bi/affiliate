-- schema.sql
-- Templates and related tables schema

-- Template table
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Template parameters table
CREATE TABLE IF NOT EXISTS template_parameters (
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  id VARCHAR(50) NOT NULL, -- parameter id (e.g., "name", "email")
  name VARCHAR(100) NOT NULL, -- display name
  type VARCHAR(20) DEFAULT 'text', -- text, url, number, date, etc.
  placeholder VARCHAR(200),
  required BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (template_id, id)
);

-- Scheduled messages table
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES templates(id),
  name VARCHAR(100) NOT NULL,
  schedule_type VARCHAR(50) NOT NULL, -- once, recurring, event
  cron_expression VARCHAR(100), -- for recurring messages
  scheduled_date TIMESTAMP WITH TIME ZONE, -- for one-time messages
  status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, failed
  session_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE
);

-- Scheduled message parameters
CREATE TABLE IF NOT EXISTS scheduled_message_params (
  scheduled_message_id INTEGER NOT NULL REFERENCES scheduled_messages(id) ON DELETE CASCADE,
  param_id VARCHAR(50) NOT NULL,
  param_value TEXT,
  PRIMARY KEY (scheduled_message_id, param_id)
);

-- Scheduled message recipients
CREATE TABLE IF NOT EXISTS scheduled_message_recipients (
  scheduled_message_id INTEGER NOT NULL REFERENCES scheduled_messages(id) ON DELETE CASCADE,
  recipient VARCHAR(100) NOT NULL,
  PRIMARY KEY (scheduled_message_id, recipient)
);

-- Scheduled message history
CREATE TABLE IF NOT EXISTS scheduled_message_history (
  id SERIAL PRIMARY KEY,
  scheduled_message_id INTEGER NOT NULL REFERENCES scheduled_messages(id) ON DELETE CASCADE,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  details JSONB -- Stores detailed results of the send operation
);

-- Insert sample templates
-- 1. Brand Video Template
INSERT INTO templates (name, description, content, category) VALUES
('Brand Video Update', 'Monthly brand video update (sent on the 2nd)', 
 '📢 Info Penting untuk Affiliate YOUVIT! 🚀
Hi Kakkk {name} 👋,
Ada update nih buat yang masih belum kenal! Yuk, kenalan lebih dalam lagi sama Youvit! 💡✨
📺 Tonton video ini untuk mengetahui informasi penting seputar Youvit 
{video_link}
📖 Untuk detail lebih lengkap, silakan cek product brief di sini:
⭐️ Brief & Product Knowledge ⭐️ 
bit.ly/youvitaffiliateprogram
Jangan sampai ketinggalan! Semakin paham produk, semakin gampang promosiinnya! 💰🔥
Kalau ada pertanyaan, feel free untuk tanya ya! 😉', 
 'marketing');

-- 2. Welcome New Affiliate
INSERT INTO templates (name, description, content, category) VALUES
('Welcome New Affiliate', 'Welcome message for new TikTok affiliates', 
 '✨Welcome to Youvit Affiliate Club✨
Hai Kak {name}! 👋
Selamat datang di Youvit Affiliate Club! 🥳 Seneng banget Kakak udah join bareng kita. Sekarang saatnya siap-siap cuan bareng Youvit! 🚀
Nah, biar makin siap promosikan produk Youvit, yuk request Free Sample Kakak sekarang!
Klik link ini buat isi formnya:
🎁 Pengajuan Sample 🎁
bit.ly/sampleyouvitindo 
*sample akan diproses maksimal 7 hari
Kalau ada pertanyaan, langsung aja tanyadi grup atau hubungi Vita +62 851-7988-0454
Let''s go, waktunya gaspol jualan bareng Youvit! 💪💚
Salam cuan,
Tim Youvit Affiliate', 
 'onboarding');

-- 3. Promotion Tips
INSERT INTO templates (name, description, content, category) VALUES
('Promotion Tips', 'Weekly promotion tips (sent every Monday)', 
 '🚀 Tips Penting Saat Promosiin YOUVIT!
Hi Kakk {name} 👋,
Biar promosi kamu makin efektif ada beberapa hal penting yang perlu diperhatikan saat mempromosikan YOUVIT! 📢✨
👉 Cek foto ini yaaa untuk detail lebih jelas!
{tips_image}
Pastikan promosi kamu sesuai dengan panduan ya, biar hasilnya makin maksimal! 🚀🔥 Kalau ada pertanyaan, jangan ragu untuk tanya!
Sukses selalu! 💪💰', 
 'education');

-- 4. Top Livestream Performers
INSERT INTO templates (name, description, content, category) VALUES
('Top Livestream Performers', 'Weekly top livestream affiliates (sent every Friday)', 
 '🌟 Top Affiliate Livestream Terbaik Minggu Ini! 🚀
Hi Kakk {name} 👋,
Mau tahu siapa saja affiliate dengan performa dan kualitas livestream terbaik minggu ini? Yuk, belajar dari yang terbaik! 📈✨
Berikut affiliate dengan kinerja & kualitas livestream terbaik minggu ini:
🏆 1. {top_1_name}
🏆 2. {top_2_name}
🏆 3. {top_3_name}
Mereka berhasil menarik banyak penonton dan meningkatkan konversi! 🔥 Yuk, cek akun mereka dan pelajari strategi yang bisa kamu contoh untuk meningkatkan performa livestream-mu! 🚀
Kalau ada pertanyaan atau butuh tips tambahan, feel free untuk tanya ya! 😉
Sukses selalu! 💪💰', 
 'recognition');

-- 5. Top Video Content
INSERT INTO templates (name, description, content, category) VALUES
('Top Video Content', 'Weekly top video content (sent every Thursday)', 
 '🎥 Top 3 Video Terbaik Minggu Ini! 🚀
Hi Kakk {name} 👋,
Mau tahu video promosi YOUVIT yang paling menarik minggu ini? Yuk, lihat dan pelajari strategi mereka biar konten kamu makin maksimal! 🔥
📌 Top 3 Video Terbaik Minggu Ini:
🥇 1. {video_1_link}
🥈 2. {video_2_link}
🥉 3. {video_3_link}
Video-video ini berhasil menarik banyak views dan engagement! Yuk, cek dan ambil inspirasi buat bikin konten yang lebih menarik dan efektif! 🚀✨
Kalau ada pertanyaan atau butuh tips tambahan, jangan ragu untuk tanya ya! 😉
Sukses selalu! 💪💰', 
 'recognition');

-- 6. Product Knowledge
INSERT INTO templates (name, description, content, category) VALUES
('Product Knowledge', 'Weekly product knowledge update (sent every Tuesday)', 
 '📢 Product Knowledge YOUVIT – Cek Foto & Video Ini! 🎥📸
Hi Kakk {name} 👋,
Biar promosi makin maksimal, pastikan kamu paham produk YOUVIT dengan baik! 🚀✨ Kami sudah siapkan foto & video yang bisa kamu pelajari untuk memahami:
✅ Manfaat utama produk
✅ Cara konsumsi yang benar
✅ Keunggulan produk
📸 Cek foto terlampir untuk detail informasi produk!
{info_image}
🎥 Tonton video ini untuk lebih jelasnya: {info_video}
Semakin kamu paham, semakin mudah promosiin dan makin banyak closing! 🔥💰 Kalau ada pertanyaan, jangan ragu untuk tanya ya! 😉
Sukses selalu! 💪', 
 'education');

-- Insert parameters for Brand Video template
INSERT INTO template_parameters (template_id, id, name, type, placeholder, required) VALUES
(1, 'name', 'Affiliate Name', 'text', 'Enter affiliate name', true),
(1, 'video_link', 'Video Link', 'url', 'Enter video URL', true);

-- Insert parameters for Welcome New Affiliate template
INSERT INTO template_parameters (template_id, id, name, type, placeholder, required) VALUES
(2, 'name', 'Affiliate Name', 'text', 'Enter affiliate name', true);

-- Insert parameters for Promotion Tips template
INSERT INTO template_parameters (template_id, id, name, type, placeholder, required) VALUES
(3, 'name', 'Affiliate Name', 'text', 'Enter affiliate name', true),
(3, 'tips_image', 'Tips Image', 'url', 'Enter image URL', true);

-- Insert parameters for Top Livestream Performers template
INSERT INTO template_parameters (template_id, id, name, type, placeholder, required) VALUES
(4, 'name', 'Affiliate Name', 'text', 'Enter affiliate name', true),
(4, 'top_1_name', 'Top Performer 1', 'text', 'Enter name of top performer', true),
(4, 'top_2_name', 'Top Performer 2', 'text', 'Enter name of second performer', true),
(4, 'top_3_name', 'Top Performer 3', 'text', 'Enter name of third performer', true);

-- Insert parameters for Top Video Content template
INSERT INTO template_parameters (template_id, id, name, type, placeholder, required) VALUES
(5, 'name', 'Affiliate Name', 'text', 'Enter affiliate name', true),
(5, 'video_1_link', 'Top Video 1', 'url', 'Enter URL of top video', true),
(5, 'video_2_link', 'Top Video 2', 'url', 'Enter URL of second video', true),
(5, 'video_3_link', 'Top Video 3', 'url', 'Enter URL of third video', true);

-- Insert parameters for Product Knowledge template
INSERT INTO template_parameters (template_id, id, name, type, placeholder, required) VALUES
(6, 'name', 'Affiliate Name', 'text', 'Enter affiliate name', true),
(6, 'info_image', 'Info Image', 'url', 'Enter image URL', true),
(6, 'info_video', 'Info Video', 'url', 'Enter video URL', true);