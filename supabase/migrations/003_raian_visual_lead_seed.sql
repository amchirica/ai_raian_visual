-- Raian Visual — Lead Engine demo (fields, scoring, widgets)
-- Run after 002_lead_engine.sql

DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE slug = 'raian-visual';
  IF v_client_id IS NULL THEN RETURN; END IF;

  UPDATE clients SET settings = settings || '{
    "locale": "ro",
    "timezone": "Europe/Bucharest",
    "country": "Romania",
    "industry": "wedding_photo_video",
    "service_areas": ["Iași", "Moldova", "România"],
    "lead_scoring": {
      "rules": [
        { "type": "field_in_list", "field": "desired_services", "value": ["photo+video", "photo + video"], "points": 20, "label": "Pachet foto+video (valoare ridicată)" },
        { "type": "budget_range_min", "field": "budget_range", "min": 1700, "points": 12, "label": "Buget warm+ (peste 1700 EUR)" },
        { "type": "budget_range_min", "field": "budget_range", "min": 2100, "points": 10, "label": "Buget hot (peste 2100 EUR)" },
        { "type": "field_in_list", "field": "city", "value": ["Iași", "Iasi", "Iaşi", "Moldova", "moldova"], "points": 15, "label": "Zonă locală (Iași / Moldova)" },
        { "type": "required_fields_complete", "points": 15, "label": "Câmpuri obligatorii complete" },
        { "type": "completeness", "points": 15, "label": "Formular complet" },
        { "type": "date_within_months", "field": "wedding_date", "months": 18, "points": 10, "label": "Nuntă în următoarele 6–18 luni" }
      ],
      "thresholds": { "hot": 70, "warm": 40 },
      "recommended_actions": {
        "hot": "Contactează în 2 ore, verifică disponibilitatea datei și trimite ofertă Signature/Essential",
        "warm": "Follow-up în 24 ore cu pachete recomandate — CTA: Verifică disponibilitatea datei",
        "cold": "Califică bugetul și serviciile; lead posibil price-focused"
      }
    },
    "notifications": { "notify_email": "contact@raianvisual.ro" }
  }'::jsonb WHERE id = v_client_id;

  UPDATE business_profiles SET
    tagline = 'Foto & video de nuntă — amintiri cinematice, elegante',
    description = 'Studio premium de fotografie și videografie de nuntă în Iași, Moldova și în toată România.',
    contact_phone = '0740607882',
    primary_color = '#7c3aed',
    metadata = '{"country":"Romania","service_areas":["Iași","Moldova","România"],"tone":"premium, warm, direct, elegant, professional"}'::jsonb
  WHERE client_id = v_client_id;

  DELETE FROM lead_fields WHERE client_id = v_client_id;

  INSERT INTO lead_fields (client_id, field_key, label, field_type, placeholder, options, is_required, sort_order)
  VALUES
    (v_client_id, 'name', 'Nume complet', 'text', 'Numele tău', '[]'::jsonb, TRUE, 1),
    (v_client_id, 'phone', 'Telefon', 'phone', '07xx xxx xxx', '[]'::jsonb, TRUE, 2),
    (v_client_id, 'email', 'Email', 'email', 'email@exemplu.ro', '[]'::jsonb, TRUE, 3),
    (v_client_id, 'wedding_date', 'Data nunții', 'date', NULL, '[]'::jsonb, TRUE, 4),
    (v_client_id, 'city', 'Oraș', 'text', 'Iași', '[]'::jsonb, TRUE, 5),
    (v_client_id, 'venue', 'Locația / sala', 'text', 'Numele locației', '[]'::jsonb, FALSE, 6),
    (v_client_id, 'number_of_guests', 'Număr invitați', 'number', '150', '[]'::jsonb, FALSE, 7),
    (v_client_id, 'desired_services', 'Servicii dorite', 'select', NULL,
      '["photo", "video", "photo+video"]'::jsonb, TRUE, 8),
    (v_client_id, 'budget_range', 'Buget estimativ', 'budget_range', NULL,
      '["sub 1400 EUR", "1400-1700 EUR", "1700-2100 EUR", "2100-2700 EUR", "peste 2700 EUR"]'::jsonb, TRUE, 9),
    (v_client_id, 'priority', 'Prioritatea ta', 'select', NULL,
      '["photo", "video", "highlight", "album", "fast delivery", "price"]'::jsonb, FALSE, 10),
    (v_client_id, 'message', 'Detalii suplimentare', 'textarea', 'Spune-ne despre nunta voastră...', '[]'::jsonb, FALSE, 11);

  UPDATE widget_settings SET
    title = 'Solicită ofertă foto-video',
    subtitle = 'Completează formularul — revenim în 24h cu ofertă personalizată',
    config = '{"submitLabel":"Trimite solicitarea","successMessage":"Mulțumim! Verificăm disponibilitatea datei și revenim curând."}'::jsonb
  WHERE client_id = v_client_id AND widget_type = 'lead-form';

END $$;
