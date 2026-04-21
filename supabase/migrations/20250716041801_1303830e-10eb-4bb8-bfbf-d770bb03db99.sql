-- Add isOptional field to section configurations
-- Hero and bio sections will be required (isOptional: false)
-- All other sections will be optional (isOptional: true)

UPDATE public.portfolio_settings 
SET section_configs = (
  SELECT jsonb_object_agg(
    key,
    CASE 
      -- Hero and Bio sections are required (not optional)
      WHEN key IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') THEN
        value || jsonb_build_object('isOptional', false)
      -- All other sections are optional
      ELSE
        value || jsonb_build_object('isOptional', true)
    END
  )
  FROM jsonb_each(COALESCE(section_configs, '{}'::jsonb))
)
WHERE section_configs IS NOT NULL AND section_configs != '{}'::jsonb;

-- For records with null or empty section_configs, initialize with default structure
UPDATE public.portfolio_settings 
SET section_configs = jsonb_build_object(
  '00000000-0000-0000-0000-000000000001', jsonb_build_object('type', 'hero', 'isOptional', false),
  '00000000-0000-0000-0000-000000000002', jsonb_build_object('type', 'bio', 'isOptional', false),
  '00000000-0000-0000-0000-000000000003', jsonb_build_object('type', 'featured_cards', 'isOptional', true),
  '00000000-0000-0000-0000-000000000004', jsonb_build_object('type', 'videos', 'isOptional', true),
  '00000000-0000-0000-0000-000000000005', jsonb_build_object('type', 'photos', 'isOptional', true),
  '00000000-0000-0000-0000-000000000006', jsonb_build_object('type', 'releases', 'isOptional', true),
  '00000000-0000-0000-0000-000000000007', jsonb_build_object('type', 'events', 'isOptional', true)
)
WHERE section_configs IS NULL OR section_configs = '{}'::jsonb;