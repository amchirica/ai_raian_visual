-- Raian Visual — Demo preview records (leads, offer, follow-ups, content, chat)
-- Run after 009_raian_visual_content_seed.sql
-- DEMO DATA ONLY — tagged with metadata.demo = true; not used by application logic.

DO $$
DECLARE
  v_client_id UUID;
  v_pkg_signature UUID;
  v_lead_hot UUID;
  v_lead_warm UUID;
  v_lead_cold UUID;
  v_offer UUID;
  v_sequence UUID;
  v_conv UUID;
  v_wedding_hot DATE := (CURRENT_DATE + INTERVAL '8 months')::date;
  v_wedding_warm DATE := (CURRENT_DATE + INTERVAL '14 months')::date;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE slug = 'raian-visual';
  IF v_client_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_pkg_signature FROM packages WHERE client_id = v_client_id AND slug = 'signature';

  -- Clean previous demo preview rows
  DELETE FROM chat_messages WHERE client_id = v_client_id
    AND conversation_id IN (SELECT id FROM chat_conversations WHERE metadata->>'demo' = 'true');
  DELETE FROM chat_conversations WHERE client_id = v_client_id AND metadata->>'demo' = 'true';
  DELETE FROM scheduled_followups WHERE client_id = v_client_id AND metadata->>'demo' = 'true';
  DELETE FROM generated_content WHERE client_id = v_client_id AND metadata->>'demo' = 'true';
  DELETE FROM offer_items WHERE client_id = v_client_id
    AND offer_id IN (SELECT id FROM offers WHERE metadata->>'demo' = 'true');
  DELETE FROM followup_sequences WHERE client_id = v_client_id AND metadata->>'demo' = 'true';
  DELETE FROM offers WHERE client_id = v_client_id AND metadata->>'demo' = 'true';
  DELETE FROM leads WHERE client_id = v_client_id AND metadata->>'demo' = 'true';

  -- ─── Demo leads ───────────────────────────────────────────────────────────

  INSERT INTO leads (
    client_id, status, score, score_category, score_explanation, recommended_action,
    source, name, email, phone, message, form_data, metadata
  ) VALUES (
    v_client_id, 'qualified', 97, 'hot',
    'Score 97/100. Matched: Pachet foto+video (valoare ridicată); Buget warm+ (peste 1700 EUR); Buget hot (peste 2100 EUR); Zonă locală (Iași / Moldova); Câmpuri obligatorii complete; Formular complet; Nuntă în următoarele 6–18 luni.',
    'Contactează în 2 ore, verifică disponibilitatea datei și trimite ofertă Signature/Essential',
    'embed_form',
    'Maria Popescu & Andrei Ionescu',
    'maria.andrei.demo@example.com',
    '0740123456',
    'Ne dorim acoperire foto+video completă, cu highlight cinematic. Sala Grand Events Iași, ~160 invitați.',
    jsonb_build_object(
      'name', 'Maria Popescu & Andrei Ionescu',
      'phone', '0740123456',
      'email', 'maria.andrei.demo@example.com',
      'wedding_date', v_wedding_hot::text,
      'city', 'Iași',
      'venue', 'Grand Events Iași',
      'number_of_guests', 160,
      'desired_services', 'photo+video',
      'budget_range', '2100-2700 EUR',
      'priority', 'highlight',
      'message', 'Ne dorim acoperire foto+video completă, cu highlight cinematic.'
    ),
    '{"demo":true,"demo_key":"hot_lead","label":"Demo — lead HOT (foto+video, buget 2100–2700, Iași)"}'::jsonb
  ) RETURNING id INTO v_lead_hot;

  INSERT INTO leads (
    client_id, status, score, score_category, score_explanation, recommended_action,
    source, name, email, phone, message, form_data, metadata
  ) VALUES (
    v_client_id, 'new', 52, 'warm',
    'Score 52/100. Matched: Buget warm+ (peste 1700 EUR); Câmpuri obligatorii complete; Formular complet; Nuntă în următoarele 6–18 luni.',
    'Follow-up în 24 ore cu pachete recomandate — CTA: Verifică disponibilitatea datei',
    'embed_form',
    'Elena Dumitrescu',
    'elena.demo@example.com',
    '0720987654',
    'Căutăm videograf pentru nuntă în Bacău.',
    jsonb_build_object(
      'name', 'Elena Dumitrescu',
      'phone', '0720987654',
      'email', 'elena.demo@example.com',
      'wedding_date', v_wedding_warm::text,
      'city', 'Bacău',
      'venue', 'Restaurant La Castel',
      'number_of_guests', 80,
      'desired_services', 'video',
      'budget_range', '1700-2100 EUR',
      'priority', 'video',
      'message', 'Căutăm videograf pentru nuntă în Bacău.'
    ),
    '{"demo":true,"demo_key":"warm_lead","label":"Demo — lead WARM (video, buget 1700–2100)"}'::jsonb
  ) RETURNING id INTO v_lead_warm;

  INSERT INTO leads (
    client_id, status, score, score_category, score_explanation, recommended_action,
    source, name, email, phone, message, form_data, metadata
  ) VALUES (
    v_client_id, 'new', 28, 'cold',
    'Score 28/100. Matched: Câmpuri obligatorii complete; Formular complet. Fără foto+video, fără buget warm+, fără zonă locală — profil price-focused.',
    'Califică bugetul și serviciile; lead posibil price-focused',
    'embed_form',
    'Alex M.',
    'alex.demo@example.com',
    '0755111222',
    'Cât e cel mai ieftin pachet? Aveți ceva sub 1000 euro?',
    jsonb_build_object(
      'name', 'Alex M.',
      'phone', '0755111222',
      'email', 'alex.demo@example.com',
      'wedding_date', (CURRENT_DATE + INTERVAL '24 months')::text,
      'city', 'București',
      'desired_services', 'photo',
      'budget_range', 'sub 1400 EUR',
      'priority', 'price',
      'message', 'Cât e cel mai ieftin pachet? Aveți ceva sub 1000 euro?'
    ),
    '{"demo":true,"demo_key":"cold_lead","label":"Demo — lead COLD (price-focused, buget sub 1400)"}'::jsonb
  ) RETURNING id INTO v_lead_cold;

  -- ─── Demo offer (hot lead → Signature) ──────────────────────────────────────

  INSERT INTO offers (
    client_id, lead_id, package_id, title, status, total_amount, currency,
    valid_until, sent_at, email_body, text_summary, delivery_terms, next_steps, cta_text,
    content_html, metadata
  ) VALUES (
    v_client_id,
    v_lead_hot,
    v_pkg_signature,
    'Ofertă Signature — Maria & Andrei',
    'sent',
    2099.00,
    'EUR',
    NOW() + INTERVAL '14 days',
    NOW() - INTERVAL '2 days',
    'Bună Maria & Andrei,

Îți trimitem oferta personalizată pentru acoperire foto+video de nuntă.

Pachet recomandat: Signature — 2099 EUR
Valabilitate: ' || to_char(NOW() + INTERVAL '14 days', 'DD.MM.YYYY') || '

Include: 12 ore acoperire, 450+ fotografii editate, highlight film 6–7 min, program 08:00–20:00.

Verificăm disponibilitatea pentru ' || to_char(v_wedding_hot, 'DD.MM.YYYY') || ' — răspunde la acest email sau sună 0740607882.

Cu drag,
Raian Visual',
    'Pachet Signature — 2099 EUR · 12h · 450+ foto · highlight 6–7 min · valabil 14 zile',
    'Fotografii editate în 30–45 zile lucrătoare. Film final în 60–90 zile.',
    'Pentru confirmare: răspunde la email sau sună 0740607882. Verifică disponibilitatea datei.',
    'Verifică disponibilitatea datei',
    '<article><h1>Ofertă Signature — Raian Visual</h1><p>Pentru <strong>Maria Popescu &amp; Andrei Ionescu</strong></p><p>Data nunții: ' || to_char(v_wedding_hot, 'DD Mon YYYY') || ' · Iași · Grand Events</p><h2>Pachet Signature — 2099 EUR</h2><ul><li>12 ore acoperire foto + video</li><li>450+ fotografii editate</li><li>Highlight film cinematic 6–7 min</li><li>Program: 08:00–20:00</li></ul><p><strong>CTA:</strong> Verifică disponibilitatea datei</p></article>',
    '{"demo":true,"demo_key":"example_offer","recommended_package":"signature"}'::jsonb
  ) RETURNING id INTO v_offer;

  INSERT INTO offer_items (client_id, offer_id, item_type, item_id, name, description, quantity, unit_price, total_price)
  VALUES (
    v_client_id, v_offer, 'package', v_pkg_signature,
    'Signature', 'Pachet recomandat — calitate cinematică, highlight film, 12h acoperire',
    1, 2099.00, 2099.00
  );

  -- ─── Demo follow-up sequence + scheduled messages ───────────────────────────

  INSERT INTO followup_sequences (
    client_id, lead_id, offer_id, name, trigger_event, require_approval, description, metadata
  ) VALUES (
    v_client_id, v_lead_hot, v_offer,
    'Post-offer — Maria & Andrei (demo)',
    'offer.sent', TRUE,
    'Demo: 24h reminder · 72h confirmare dată · 7 zile reminder final',
    '{"demo":true}'::jsonb
  ) RETURNING id INTO v_sequence;

  INSERT INTO scheduled_followups (
    client_id, sequence_id, lead_id, offer_id, channel, subject, body, status, scheduled_for, metadata
  ) VALUES
    (
      v_client_id, v_sequence, v_lead_hot, v_offer, 'email',
      'Oferta ta foto-video — Raian Visual',
      'Bună Maria & Andrei,

Sperăm că ai avut timp să parcurgi oferta noastră pentru pachetul Signature.

Dacă ai întrebări despre acoperire, livrare sau extra (dronă, album, highlight), suntem aici — răspundem cu plăcere.

Verifică disponibilitatea datei — răspunde la acest email sau sună 0740607882.

Cu drag,
Echipa Raian Visual',
      'pending_approval',
      NOW() - INTERVAL '1 day',
      '{"demo":true,"step":"24h_reminder","delay_hours":24}'::jsonb
    ),
    (
      v_client_id, v_sequence, v_lead_hot, v_offer, 'email',
      'Disponibilitate dată — Raian Visual',
      'Bună Maria & Andrei,

Revenim cu un scurt mesaj — ai dori să confirmăm disponibilitatea pentru data nunții voastre (' || to_char(v_wedding_hot, 'DD.MM.YYYY') || ')?

Dacă pachetul Signature ți se potrivește, putem rezerva data provizoriu după avans (30%).

Verifică disponibilitatea datei — răspunde la acest email sau sună-ne.

Cu drag,
Raian Visual',
      'pending_approval',
      NOW() + INTERVAL '1 day',
      '{"demo":true,"step":"72h_date_confirmation","delay_hours":72}'::jsonb
    ),
    (
      v_client_id, v_sequence, v_lead_hot, v_offer, 'email',
      'Reminder elegant — Raian Visual',
      'Bună Maria & Andrei,

Îți scriem elegant, fără presiune — oferta pentru Signature rămâne deschisă încă puțin timp.

Dacă ai nevoie de clarificări sau vrei o variantă de pachet, suntem la un mesaj distanță.

Verifică disponibilitatea datei.

Cu respect și căldură,
Echipa Raian Visual',
      'pending_approval',
      NOW() + INTERVAL '5 days',
      '{"demo":true,"step":"7d_final_reminder","delay_hours":168}'::jsonb
    );

  -- ─── Demo generated content (Meta, Instagram) ───────────────────────────────

  INSERT INTO generated_content (
    client_id, content_type, title, subject, body, status, lead_id, offer_id,
    generated_by, metadata
  ) VALUES
    (
      v_client_id, 'meta_ads_primary', 'Meta Ads — rezervări 2026 Iași', NULL,
      'Foto & video de nuntă premium în Iași și Moldova. Pachete de la 1399 EUR — acoperire cinematică, highlight film, echipă dedicată. Nu lăsa data să se ocupe fără tine: verifică disponibilitatea acum.',
      'approved', v_lead_hot, NULL, 'seed',
      '{"demo":true,"example":"meta_ads_primary"}'::jsonb
    ),
    (
      v_client_id, 'meta_ads_headline', 'Meta Ads headline', NULL,
      'Verifică disponibilitatea datei — Raian Visual',
      'approved', NULL, NULL, 'seed',
      '{"demo":true,"example":"meta_ads_headline"}'::jsonb
    ),
    (
      v_client_id, 'instagram_caption', 'Instagram — portofoliu nuntă Iași', NULL,
      'Amintiri cinematice de la o nuntă plină de emoție ✨

Foto + video premium, editare atentă, poveste autentică a zilei voastre.

Planificați nunta în Iași sau Moldova? Verifică disponibilitatea datei — link în bio.

#nunta #fotografienunta #videografienunta #iasi #raianvisual',
      'draft', NULL, NULL, 'seed',
      '{"demo":true,"example":"instagram_caption"}'::jsonb
    ),
    (
      v_client_id, 'follow_up_email', 'Follow-up 24h — demo text', 'Oferta ta foto-video — Raian Visual',
      'Bună Maria & Andrei,

Sperăm că ai avut timp să parcurgi oferta pentru pachetul Signature.

Verifică disponibilitatea datei — suntem aici pentru orice întrebare.

Cu drag,
Raian Visual · 0740607882',
      'draft', v_lead_hot, v_offer, 'seed',
      '{"demo":true,"example":"follow_up_24h"}'::jsonb
    );

  -- ─── Demo chat conversation (assistant FAQ responses) ───────────────────────

  INSERT INTO chat_conversations (client_id, lead_id, visitor_id, status, metadata)
  VALUES (
    v_client_id, NULL, 'demo-visitor-001', 'resolved',
    '{"demo":true,"demo_key":"faq_preview_chat"}'::jsonb
  ) RETURNING id INTO v_conv;

  INSERT INTO chat_messages (client_id, conversation_id, role, content, metadata) VALUES
  (v_client_id, v_conv, 'assistant',
   'Bună! Sunt asistentul virtual Raian Visual. Te pot ajuta cu pachete, prețuri, livrare și rezervări. Cu ce te pot ajuta?',
   '{"demo":true}'::jsonb),
  (v_client_id, v_conv, 'user',
   'Cât costă pachetul foto+video și în cât timp primim pozele?',
   '{"demo":true}'::jsonb),
  (v_client_id, v_conv, 'assistant',
   'Pachetele foto-video: Basic — 1399 EUR, Essential — 1799 EUR (recomandat standard), Signature — 2099 EUR (cinematic), Exclusive — 2699 EUR (premium). Livrare foto: 30–45 zile lucrătoare; film final: 60–90 zile. Pentru ofertă pe data ta: verifică disponibilitatea prin formular.',
   '{"demo":true,"source":"faq"}'::jsonb),
  (v_client_id, v_conv, 'user',
   'Aveți dronă și al doilea fotograf?',
   '{"demo":true}'::jsonb),
  (v_client_id, v_conv, 'assistant',
   'Da — ambele sunt extra: filmare cu dronă 150 EUR, al doilea fotograf 200 EUR. Pachetul Exclusive include deja echipă extinsă (2 foto + 2 video). Vrei să verificăm disponibilitatea datei?',
   '{"demo":true,"source":"faq"}'::jsonb);

END $$;
