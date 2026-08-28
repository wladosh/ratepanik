-- Slot crates (Formen / Mimik / Deko) drop from 240 → 150 HC.
-- Hirnkiste stays at 100. Daily deal still applies 30% off the new base.

UPDATE lootbox_defs
SET price_hc = 150
WHERE id IN ('lootbox_form', 'lootbox_gesicht', 'lootbox_hintergrund');
