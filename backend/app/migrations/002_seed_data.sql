-- Seed data: Научная библиотека ТГУ
-- Run after 001_initial.sql

-- 1. Library
INSERT INTO libraries (id, name, description)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Научная библиотека ТГУ',
  'Научная библиотека Томского государственного университета — один из крупнейших библиотечных центров Сибири'
);

-- 2. Channels
INSERT INTO channels (id, library_id, type, custom_name, is_manual) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'website', 'Сайт библиотеки', false),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e_library', 'Электронная библиотека', false),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'catalog', 'Электронный каталог', false),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'telegram', 'Telegram-канал', true),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'vk', 'Сообщество ВКонтакте', true),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'mobile_app', 'Мобильное приложение', false);

-- 3. Metric counter (example)
INSERT INTO metric_counters (id, library_id, name, yandex_counter_id)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Основной сайт НБ ТГУ',
  '12345678'
);

-- 4. Sample traffic metrics (last 60 days)
-- Website channel
INSERT INTO traffic_metrics (library_id, channel_id, counter_id, date, views, visits, users, avg_time, depth, bounce_rate, return_rate)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  d::date,
  (800 + random() * 400)::int,    -- views: 800-1200
  (300 + random() * 200)::int,    -- visits: 300-500
  (200 + random() * 150)::int,    -- users: 200-350
  (120 + random() * 60)::numeric, -- avg_time: 120-180 sec
  (2.5 + random() * 1.5)::numeric, -- depth: 2.5-4.0
  (10 + random() * 15)::numeric,  -- bounce_rate: 10-25%
  (30 + random() * 20)::numeric   -- return_rate: 30-50%
FROM generate_series(
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '1 day',
  '1 day'
) AS d;

-- E-library channel
INSERT INTO traffic_metrics (library_id, channel_id, date, views, visits, users, avg_time, depth, bounce_rate, return_rate)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0000-0000-0000-000000000002'::uuid,
  d::date,
  (400 + random() * 300)::int,
  (150 + random() * 100)::int,
  (100 + random() * 80)::int,
  (180 + random() * 120)::numeric,
  (3.0 + random() * 2.0)::numeric,
  (8 + random() * 10)::numeric,
  (40 + random() * 20)::numeric
FROM generate_series(
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '1 day',
  '1 day'
) AS d;

-- Catalog channel
INSERT INTO traffic_metrics (library_id, channel_id, date, views, visits, users, avg_time, depth, bounce_rate, return_rate)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0000-0000-0000-000000000003'::uuid,
  d::date,
  (200 + random() * 150)::int,
  (80 + random() * 60)::int,
  (50 + random() * 40)::int,
  (90 + random() * 60)::numeric,
  (4.0 + random() * 3.0)::numeric,
  (5 + random() * 8)::numeric,
  (50 + random() * 15)::numeric
FROM generate_series(
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '1 day',
  '1 day'
) AS d;

-- 5. Sample engagement metrics (last 60 days)
-- Telegram
INSERT INTO engagement_metrics (library_id, channel_id, date, likes, reposts, comments, notes)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0000-0000-0000-000000000004'::uuid,
  d::date,
  (10 + random() * 30)::int,
  (2 + random() * 8)::int,
  (1 + random() * 5)::int,
  NULL
FROM generate_series(
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '1 day',
  '1 day'
) AS d;

-- VK
INSERT INTO engagement_metrics (library_id, channel_id, date, likes, reposts, comments, notes)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0000-0000-0000-000000000005'::uuid,
  d::date,
  (20 + random() * 50)::int,
  (5 + random() * 15)::int,
  (3 + random() * 10)::int,
  NULL
FROM generate_series(
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '1 day',
  '1 day'
) AS d;

-- 6. Sample reviews
-- Явно указываю колонки и использую DEFAULT для id (если он есть и имеет DEFAULT)
INSERT INTO reviews (id, library_id, platform, date, rating, text, sentiment) VALUES
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, 'yandex_maps', CURRENT_DATE - INTERVAL '3 days', 5, 'Отличная библиотека! Огромный фонд и удобный каталог.', 'positive'),
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, 'google_maps', CURRENT_DATE - INTERVAL '5 days', 4, 'Хорошее место для работы, но иногда сложно найти свободное место.', 'positive'),
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, '2gis', CURRENT_DATE - INTERVAL '7 days', 5, 'Прекрасные условия для исследовательской работы.', 'positive'),
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, 'yandex_maps', CURRENT_DATE - INTERVAL '10 days', 3, 'Сайт мог бы быть удобнее, но сама библиотека на высоте.', 'neutral'),
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, 'google_maps', CURRENT_DATE - INTERVAL '14 days', 5, 'Лучшая библиотека в городе, богатый выбор научной литературы.', 'positive'),
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, '2gis', CURRENT_DATE - INTERVAL '20 days', 4, 'Удобное расположение, приветливый персонал.', 'positive'),
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, 'yandex_maps', CURRENT_DATE - INTERVAL '25 days', 2, 'Долго ждал заказанную книгу, не очень довольны сервисом.', 'negative'),
  (DEFAULT, 'a0000000-0000-0000-0000-000000000001'::uuid, 'google_maps', CURRENT_DATE - INTERVAL '30 days', 4, 'Электронная библиотека работает стабильно, удобно пользоваться удалённо.', 'positive');