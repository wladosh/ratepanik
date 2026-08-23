-- Activate Fragemeister find_lie / order_it seed prompts so they are
-- visible under prompts_select_active RLS (playable match modes).

UPDATE prompts
SET active = true
WHERE id IN (
  '50284874-e1bf-439a-aca7-e985a3669a1f',
  'c0e99ba8-3ea6-411b-827c-2ce2b55c9a22',
  'a1728f42-0557-436f-9023-24cf14f54a1c',
  'c963b266-e139-49ae-a78c-43a9a68853ca'
);
