-- Demo seed: Raian Visual — first platform client (config only, no app logic)
-- Run AFTER 001_initial_schema.sql
-- Full wedding photo-video demo is completed by migrations 003–010.

DO $$
DECLARE
  v_client_id UUID;
BEGIN
  INSERT INTO clients (name, slug, domain, settings)
  VALUES (
    'Raian Visual',
    'raian-visual',
    'raianvisual.ro',
    '{
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
          "warm": "Follow-up în 24 ore cu pachete recomandate și CTA: Verifică disponibilitatea datei",
          "cold": "Răspunde politicos; califică bugetul și serviciile — lead posibil price-focused"
        },
        "notes": "Lead-uri cu priority=price și formular incomplet tind spre cold (fără reguli bonus foto+video/buget)."
      },
      "offer_defaults": {
        "validity_days": 14,
        "currency": "EUR",
        "delivery_terms": "Fotografii editate în 30–45 zile lucrătoare. Film final în 60–90 zile. Preview rapid — extra, 48h.",
        "next_steps": "Pentru confirmare, răspunde la acest email sau sună-ne. Verificăm disponibilitatea datei în calendar.",
        "cta_text": "Verifică disponibilitatea datei"
      },
      "notifications": { "notify_email": "contact@raianvisual.ro" }
    }'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    settings = EXCLUDED.settings
  RETURNING id INTO v_client_id;

  IF v_client_id IS NULL THEN
    SELECT id INTO v_client_id FROM clients WHERE slug = 'raian-visual';
  END IF;

  INSERT INTO business_profiles (
    client_id, company_name, tagline, description,
    primary_color, secondary_color, contact_email, contact_phone, website, address, metadata
  ) VALUES (
    v_client_id,
    'Raian Visual',
    'Foto & video de nuntă — amintiri cinematice, elegante',
    'Studio premium de fotografie și videografie de nuntă în Iași, Moldova și în toată România. Acoperire foto-video, film cinematic, livrabile de calitate și experiență personalizată pentru cupluri care își doresc amintiri autentice și elegante.',
    '#7c3aed',
    '#5b21b6',
    'contact@raianvisual.ro',
    '0740607882',
    'https://raianvisual.ro',
    'Iași, Moldova, România',
    '{"country":"Romania","service_areas":["Iași","Moldova","România"],"tone":"premium, warm, direct, elegant, professional"}'::jsonb
  )
  ON CONFLICT (client_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    contact_phone = EXCLUDED.contact_phone,
    website = EXCLUDED.website,
    address = EXCLUDED.address,
    metadata = EXCLUDED.metadata;

  INSERT INTO widget_settings (client_id, widget_type, title, subtitle, theme, config)
  VALUES
    (
      v_client_id, 'lead-form',
      'Solicită ofertă foto-video',
      'Completează formularul — revenim în 24h cu ofertă personalizată',
      '{"primaryColor":"#7c3aed","borderRadius":"12px"}'::jsonb,
      '{"submitLabel":"Trimite solicitarea","successMessage":"Mulțumim! Verificăm disponibilitatea datei și revenim curând."}'::jsonb
    ),
    (
      v_client_id, 'chat',
      'Asistent Raian Visual',
      'Întreabă despre pachete, prețuri și disponibilitate',
      '{"primaryColor":"#7c3aed"}'::jsonb,
      '{"welcomeMessage":"Bună! Sunt asistentul Raian Visual. Cu ce te pot ajuta?","placeholder":"Scrie mesajul tău..."}'::jsonb
    )
  ON CONFLICT (client_id, widget_type) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    theme = EXCLUDED.theme,
    config = EXCLUDED.config;

END $$;
