-- Raian Visual — Offer Generator demo (services, packages, extras, pricing rules, template)
-- Run after 004_offer_generator.sql

DO $$
DECLARE
  v_client_id UUID;
  v_svc_photo UUID;
  v_svc_video UUID;
  v_svc_pkg UUID;
  v_pkg_basic UUID;
  v_pkg_essential UUID;
  v_pkg_signature UUID;
  v_pkg_exclusive UUID;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE slug = 'raian-visual';
  IF v_client_id IS NULL THEN RETURN; END IF;

  DELETE FROM packages WHERE client_id = v_client_id;
  DELETE FROM services WHERE client_id = v_client_id;

  INSERT INTO services (client_id, name, slug, description, category, base_price, currency, sort_order)
  VALUES
    (v_client_id, 'Fotografie de nuntă', 'wedding-photography',
     'Acoperire foto profesională — pregătiri, ceremonie, petrecere, portrete de cuplu.', 'wedding', 899, 'EUR', 1),
    (v_client_id, 'Videografie de nuntă', 'wedding-videography',
     'Filmare cinematică — momente cheie, emoție autentică, sunet ambiental.', 'wedding', 899, 'EUR', 2),
    (v_client_id, 'Pachet foto-video', 'photo-video-package',
     'Acoperire completă foto + video, echipă coordonată, livrabile integrate.', 'wedding', 1399, 'EUR', 3),
    (v_client_id, 'Filmare cu dronă', 'drone-footage',
     'Cadre aeriene spectaculoase — locație, exterior, grupuri (condiții meteo și reglementări).', 'extra', 150, 'EUR', 4),
    (v_client_id, 'Highlight film', 'highlight-film',
     'Film scurt cinematic 3–7 min — montaj dinamic, muzică, emoție concentrată.', 'extra', 150, 'EUR', 5),
    (v_client_id, 'Album foto de nuntă', 'wedding-album',
     'Album premium tipărit, design personalizat, selecție foto curată.', 'extra', 180, 'EUR', 6),
    (v_client_id, 'Al doilea fotograf', 'second-photographer',
     'Acoperire simultană — pregătiri, detalii, unghiuri multiple.', 'extra', 200, 'EUR', 7),
    (v_client_id, 'Al doilea videograf', 'second-videographer',
     'Unghiuri video multiple, acoperire extinsă ceremonie + petrecere.', 'extra', 250, 'EUR', 8),
    (v_client_id, 'Preview rapid (48h)', 'fast-delivery-preview',
     'Selecție foto preview livrată în 48 de ore de la eveniment.', 'extra', 80, 'EUR', 9)
  ON CONFLICT (client_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    is_active = TRUE;

  SELECT id INTO v_svc_pkg FROM services WHERE client_id = v_client_id AND slug = 'photo-video-package';

  INSERT INTO packages (client_id, service_id, name, slug, description, price, currency, sort_order, metadata)
  VALUES
    (v_client_id, v_svc_pkg, 'Basic', 'basic',
     'Pentru evenimente mai mici sau buget redus — acoperire esențială foto-video.',
     1399, 'EUR', 1,
     '{"tier":"entry","hours":8,"photographers":1,"videographers":1,"recommended_for":"evenimente mici, buget sub 1700 EUR"}'::jsonb),
    (v_client_id, v_svc_pkg, 'Essential', 'essential',
     'Pachet echilibrat foto+video — acoperire standard recomandată pentru majoritatea nunților.',
     1799, 'EUR', 2,
     '{"tier":"standard","hours":10,"photographers":1,"videographers":1,"recommended_for":"acoperire foto-video standard","is_recommended":true}'::jsonb),
    (v_client_id, v_svc_pkg, 'Signature', 'signature',
     'Pachet recomandat echilibrat — calitate cinematică, highlight film, acoperire extinsă.',
     2099, 'EUR', 3,
     '{"tier":"premium","hours":12,"photographers":1,"videographers":1,"highlight":true,"recommended_for":"nunți echilibrate, calitate cinematică","is_recommended":true}'::jsonb),
    (v_client_id, v_svc_pkg, 'Exclusive', 'exclusive',
     'Premium — acoperire extinsă, echipă mărită, evenimente mari, livrabile premium.',
     2699, 'EUR', 4,
     '{"tier":"luxury","hours":14,"photographers":2,"videographers":2,"highlight":true,"4k":true,"album_included":true,"recommended_for":"nunți premium, evenimente mari"}'::jsonb)
  ON CONFLICT (client_id, slug) DO UPDATE SET
    price = EXCLUDED.price,
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata,
    service_id = EXCLUDED.service_id;

  SELECT id INTO v_pkg_basic FROM packages WHERE client_id = v_client_id AND slug = 'basic';
  SELECT id INTO v_pkg_essential FROM packages WHERE client_id = v_client_id AND slug = 'essential';
  SELECT id INTO v_pkg_signature FROM packages WHERE client_id = v_client_id AND slug = 'signature';
  SELECT id INTO v_pkg_exclusive FROM packages WHERE client_id = v_client_id AND slug = 'exclusive';

  DELETE FROM package_features WHERE client_id = v_client_id;

  INSERT INTO package_features (client_id, package_id, name, description, sort_order)
  VALUES
    (v_client_id, v_pkg_basic, '8 ore acoperire', 'Foto + video pe durata evenimentului', 1),
    (v_client_id, v_pkg_basic, '250+ fotografii editate', 'Galerie online privată', 2),
    (v_client_id, v_pkg_basic, 'Film 3–4 min', 'Highlight scurt de nuntă', 3),
    (v_client_id, v_pkg_basic, 'Program: 10:00–18:00', 'Acoperire standard o zi', 4),
    (v_client_id, v_pkg_essential, '10 ore acoperire', 'Foto + video complet', 1),
    (v_client_id, v_pkg_essential, '350+ fotografii editate', 'Galerie online HD', 2),
    (v_client_id, v_pkg_essential, 'Film 5–6 min', 'Highlight + momente cheie', 3),
    (v_client_id, v_pkg_essential, 'Program: 09:00–19:00', 'Acoperire extinsă', 4),
    (v_client_id, v_pkg_signature, '12 ore acoperire', 'Calitate cinematică', 1),
    (v_client_id, v_pkg_signature, '450+ fotografii editate', 'Editare premium', 2),
    (v_client_id, v_pkg_signature, 'Highlight film 6–7 min', 'Montaj cinematic avansat', 3),
    (v_client_id, v_pkg_signature, 'Program: 08:00–20:00', 'Acoperire full day', 4),
    (v_client_id, v_pkg_exclusive, '14 ore acoperire', 'Echipă extinsă (2 foto + 2 video)', 1),
    (v_client_id, v_pkg_exclusive, '550+ fotografii editate', 'Album foto premium inclus', 2),
    (v_client_id, v_pkg_exclusive, '4K + highlight 8–10 min', 'Livrabile premium', 3),
    (v_client_id, v_pkg_exclusive, 'Program: 07:00–21:00', 'Acoperire maximă', 4);

  DELETE FROM package_extras WHERE client_id = v_client_id;

  INSERT INTO package_extras (client_id, name, slug, description, price, currency, sort_order)
  VALUES
    (v_client_id, 'Filmare cu dronă', 'drone-footage', 'Cadre aeriene spectaculoase', 150, 'EUR', 1),
    (v_client_id, 'Highlight film suplimentar', 'highlight-film-extra', 'Film scurt cinematic adițional', 150, 'EUR', 2),
    (v_client_id, 'Album foto premium', 'wedding-album', 'Album 30x30cm, 30 pagini', 180, 'EUR', 3),
    (v_client_id, 'Al doilea fotograf', 'second-photographer', 'Acoperire simultană completă', 200, 'EUR', 4),
    (v_client_id, 'Al doilea videograf', 'second-videographer', 'Unghiuri video multiple', 250, 'EUR', 5),
    (v_client_id, 'Livrare 4K', '4k-delivery', 'Fișiere video rezoluție 4K', 100, 'EUR', 6),
    (v_client_id, 'Oră suplimentară', 'extra-hour', 'Prelungire acoperire', 120, 'EUR', 7),
    (v_client_id, 'Preview rapid 48h', 'fast-delivery-preview', 'Selecție foto preview în 48h', 80, 'EUR', 8);

  DELETE FROM pricing_rules WHERE client_id = v_client_id;

  INSERT INTO pricing_rules (client_id, name, rule_type, conditions, action, priority)
  VALUES
    (v_client_id, 'Basic — eveniment mic / buget redus', 'recommend_package',
      '[{"field":"budget_range","operator":"budget_max","value":1700}]'::jsonb,
      '{"package_slug":"basic","reason":"Potrivit pentru evenimente mai mici sau buget sub 1700 EUR"}'::jsonb, 20),
    (v_client_id, 'Essential — foto+video standard', 'recommend_package',
      '[{"field":"desired_services","operator":"contains","value":"photo+video"},{"field":"budget_range","operator":"budget_between","value":{"min":1700,"max":2100}}]'::jsonb,
      '{"package_slug":"essential","reason":"Acoperire foto-video standard — pachet echilibrat recomandat"}'::jsonb, 100),
    (v_client_id, 'Signature — echilibrat cinematic', 'recommend_package',
      '[{"field":"desired_services","operator":"contains","value":"photo+video"},{"field":"budget_range","operator":"budget_between","value":{"min":2100,"max":2700}}]'::jsonb,
      '{"package_slug":"signature","reason":"Pachet recomandat — calitate cinematică și highlight film"}'::jsonb, 110),
    (v_client_id, 'Signature — highlight priority', 'recommend_package',
      '[{"field":"priority","operator":"in","value":["highlight","video"]},{"field":"budget_range","operator":"budget_min","value":1700}]'::jsonb,
      '{"package_slug":"signature","reason":"Prioritate highlight/video — Signature oferă film cinematic extins"}'::jsonb, 90),
    (v_client_id, 'Exclusive — premium / eveniment mare', 'recommend_package',
      '[{"field":"budget_range","operator":"budget_min","value":2700}]'::jsonb,
      '{"package_slug":"exclusive","reason":"Buget premium — acoperire extinsă și livrabile Exclusive"}'::jsonb, 120),
    (v_client_id, 'Exclusive — mulți invitați', 'recommend_package',
      '[{"field":"number_of_guests","operator":"gte","value":180},{"field":"budget_range","operator":"budget_min","value":2100}]'::jsonb,
      '{"package_slug":"exclusive","reason":"Eveniment mare — echipă extinsă și acoperire premium"}'::jsonb, 85);

  INSERT INTO content_templates (client_id, template_key, name, template_type, subject, body, variables, metadata)
  VALUES (
    v_client_id, 'offer_default', 'Șablon ofertă standard', 'offer',
    'Ofertă {{package_name}} — {{company_name}}',
    'Bună {{lead_name}},

Îți trimitem oferta personalizată pentru {{requested_service}}.

Pachet recomandat: {{package_name}} — {{package_price}} {{currency}}
Valabilitate: {{valid_until}}

{{next_steps}}

Cu drag,
{{company_name}}',
    '["lead_name","company_name","package_name","package_price","currency","requested_service","valid_until","next_steps"]'::jsonb,
    '{"delivery_terms":"Fotografii editate în 30–45 zile. Film final în 60–90 zile.","next_steps":"Verifică disponibilitatea datei — răspunde la acest email sau sună 0740607882.","cta_text":"Verifică disponibilitatea datei","validity_days":14}'::jsonb
  )
  ON CONFLICT (client_id, template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    metadata = EXCLUDED.metadata;

  UPDATE clients SET settings = settings || '{
    "offer_defaults": {
      "validity_days": 14,
      "currency": "EUR",
      "delivery_terms": "Fotografii editate în 30–45 zile lucrătoare. Film final în 60–90 zile. Preview rapid — extra, 48h.",
      "next_steps": "Pentru confirmare, răspunde la acest email sau sună 0740607882. Verificăm disponibilitatea datei în calendar.",
      "cta_text": "Verifică disponibilitatea datei"
    }
  }'::jsonb WHERE id = v_client_id;

END $$;
