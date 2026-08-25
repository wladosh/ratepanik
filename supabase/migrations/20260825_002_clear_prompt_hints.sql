-- Question hints are retired. Keep the column for compatibility, but never
-- expose spoiler copy to players.
UPDATE prompts
SET hint = NULL
WHERE hint IS NOT NULL;
