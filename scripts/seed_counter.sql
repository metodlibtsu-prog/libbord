INSERT INTO metric_counters (id, library_id, name, yandex_counter_id, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Основной сайт НБ ТГУ',
  '12345678',
  true
) ON CONFLICT (id) DO NOTHING;

SELECT 'libraries:', count(*) FROM libraries;
SELECT 'channels:', count(*) FROM channels;
SELECT 'metric_counters:', count(*) FROM metric_counters;
