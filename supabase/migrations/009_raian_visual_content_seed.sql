-- Raian Visual — Content & Follow-up Engine demo settings + message templates
-- Run after 008_content_followup_engine.sql

DO $$
DECLARE
  v_client_id UUID;
  v_sequence_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE slug = 'raian-visual';
  IF v_client_id IS NULL THEN RETURN; END IF;

  INSERT INTO content_settings (
    client_id, industry, tone_of_voice, target_audience, brand_positioning,
    forbidden_claims, preferred_cta, default_locale, metadata
  ) VALUES (
    v_client_id,
    'wedding_photo_video',
    'premium, warm, direct, elegant, professional',
    'Cupluri care planifică nunți în România — Iași, Moldova și național',
    'Studio foto-video premium pentru nunți cinematice — amintiri autentice, livrabile elegante, experiență personalizată',
    '["cel mai ieftin de pe piață", "video viral garantat", "promisiuni nerealiste de livrare", "scarcitate falsă", "reduceri inventate", "disponibilitate garantată fără verificare"]'::jsonb,
    'Verifică disponibilitatea datei',
    'ro',
    '{"country":"Romania","service_areas":["Iași","Moldova","România"],"contact_phone":"0740607882","website":"https://raianvisual.ro"}'::jsonb
  )
  ON CONFLICT (client_id) DO UPDATE SET
    industry = EXCLUDED.industry,
    tone_of_voice = EXCLUDED.tone_of_voice,
    target_audience = EXCLUDED.target_audience,
    brand_positioning = EXCLUDED.brand_positioning,
    forbidden_claims = EXCLUDED.forbidden_claims,
    preferred_cta = EXCLUDED.preferred_cta,
    metadata = EXCLUDED.metadata;

  INSERT INTO content_templates (client_id, template_key, name, template_type, subject, body, variables, metadata)
  VALUES
    (
      v_client_id, 'followup_offer_24h', 'Follow-up ofertă 24h — reminder politicos', 'follow_up_email',
      'Oferta ta foto-video — {{company_name}}',
      'Bună {{lead_name}},

Sperăm că ai avut timp să parcurgi oferta noastră pentru pachetul {{package_name}}.

Dacă ai întrebări despre acoperire, livrare sau extra (dronă, album, highlight), suntem aici — răspundem cu plăcere.

{{preferred_cta}}

Cu drag,
Echipa {{company_name}}
0740607882',
      '["lead_name","company_name","package_name","preferred_cta"]'::jsonb,
      '{"delay_hours":24,"channel":"email","step_name":"24h reminder"}'::jsonb
    ),
    (
      v_client_id, 'followup_offer_72h', 'Follow-up ofertă 72h — confirmare dată', 'follow_up_email',
      'Disponibilitate dată — {{company_name}}',
      'Bună {{lead_name}},

Revenim cu un scurt mesaj — ai dori să confirmăm disponibilitatea pentru data nunții tale?

Dacă pachetul {{package_name}} ți se potrivește, putem rezerva data provizoriu după avans (30%).

{{preferred_cta}} — răspunde la acest email sau sună-ne.

Cu drag,
{{company_name}}',
      '["lead_name","company_name","package_name","preferred_cta"]'::jsonb,
      '{"delay_hours":72,"channel":"email","step_name":"72h date confirmation"}'::jsonb
    ),
    (
      v_client_id, 'followup_offer_7d', 'Follow-up ofertă 7 zile — reminder final', 'follow_up_email',
      'Ultimul reminder — oferta {{company_name}}',
      'Bună {{lead_name}},

Îți scriem elegant, fără presiune — oferta pentru {{package_name}} rămâne deschisă încă puțin timp.

Dacă ai nevoie de clarificări sau vrei o variantă de pachet, suntem la un mesaj distanță.

{{preferred_cta}}

Cu respect și căldură,
Echipa {{company_name}}',
      '["lead_name","company_name","package_name","preferred_cta"]'::jsonb,
      '{"delay_hours":168,"channel":"email","step_name":"7-day final reminder"}'::jsonb
    ),
    (
      v_client_id, 'whatsapp_reminder_7d', 'WhatsApp reminder 7 zile', 'whatsapp_message',
      NULL,
      'Bună {{lead_name}}! 👋

Te contactăm de la Raian Visual — ai primit oferta noastră foto-video pentru {{package_name}}.

Vrei să verificăm disponibilitatea datei? Răspunde aici sau sună 0740607882.

Cu drag!',
      '["lead_name","package_name"]'::jsonb,
      '{"delay_hours":168,"channel":"whatsapp"}'::jsonb
    ),
    (
      v_client_id, 'instagram_wedding_portfolio', 'Instagram caption — portofoliu nuntă', 'instagram_caption',
      NULL,
      'Amintiri cinematice de la o nuntă plină de emoție ✨

Foto + video premium, editare atentă, poveste autentică a zilei voastre.

Planificați nunta în Iași sau Moldova? Verifică disponibilitatea datei — link în bio.

#nunta #nuntaromaneasca #fotografienunta #videografienunta #iasi #raianvisual #weddingphotography',
      '[]'::jsonb,
      '{"example":true}'::jsonb
    ),
    (
      v_client_id, 'instagram_behind_scenes', 'Instagram caption — behind the scenes', 'instagram_caption',
      NULL,
      'În spatele cadrelor 📸

Echipă dedicată, lumină naturală, emoții reale — așa construim amintirile voastre cinematice.

Pachete de la 1399 EUR · Essential & Signature recomandate pentru foto+video complet.

#behindthescenes #weddingfilm #cinematicwedding #raianvisual',
      '[]'::jsonb,
      '{"example":true}'::jsonb
    ),
    (
      v_client_id, 'meta_ads_bookings', 'Meta Ads — rezervări foto-video nuntă', 'meta_ads_primary',
      NULL,
      'Foto & video de nuntă premium în Iași și Moldova. Pachete de la 1399 EUR — acoperire cinematică, livrabile elegante, echipă dedicată. Verifică disponibilitatea datei tale înainte să se ocupă calendarul.',
      '[]'::jsonb,
      '{"example":true,"target":"Meta Ads primary text"}'::jsonb
    ),
    (
      v_client_id, 'meta_ads_headline', 'Meta Ads headline — disponibilitate', 'meta_ads_headline',
      NULL,
      'Verifică disponibilitatea datei — Raian Visual',
      '[]'::jsonb,
      '{"example":true}'::jsonb
    ),
    (
      v_client_id, 'seo_iasi_wedding', 'SEO outline — fotograf nuntă Iași', 'blog_outline',
      NULL,
      'H1: Fotograf și videograf nuntă Iași — ghid complet
H2: De ce contează acoperirea foto+video la nuntă
H2: Pachete Raian Visual (Basic · Essential · Signature · Exclusive)
H2: Zone acoperite: Iași, Moldova, România
H2: Proces de rezervare și avans 30%
H2: Timp de livrare foto și film
H2: Întrebări frecvente',
      '[]'::jsonb,
      '{"target_keyword":"fotograf videograf nuntă Iași","example":true}'::jsonb
    )
  ON CONFLICT (client_id, template_key) DO UPDATE SET
    name = EXCLUDED.name,
    body = EXCLUDED.body,
    subject = EXCLUDED.subject,
    metadata = EXCLUDED.metadata;

  -- Default post-offer follow-up sequence template (used when creating sequences manually)
  DELETE FROM followup_messages WHERE client_id = v_client_id
    AND sequence_id IN (
      SELECT id FROM followup_sequences
      WHERE client_id = v_client_id AND name = 'Post-offer — 24h / 72h / 7d (demo template)'
    );
  DELETE FROM followup_sequences WHERE client_id = v_client_id
    AND name = 'Post-offer — 24h / 72h / 7d (demo template)';

  INSERT INTO followup_sequences (client_id, name, trigger_event, require_approval, description)
  VALUES (
    v_client_id,
    'Post-offer — 24h / 72h / 7d (demo template)',
    'offer.sent',
    TRUE,
    'Secvență demo: reminder politicos 24h, confirmare dată 72h, reminder final elegant 7 zile.'
  )
  RETURNING id INTO v_sequence_id;

  INSERT INTO followup_messages (client_id, sequence_id, delay_hours, channel, name, subject, body_template, sort_order, require_approval)
  VALUES
    (v_client_id, v_sequence_id, 24, 'email', '24h reminder',
     'Oferta ta foto-video — {{company_name}}',
     'Bună {{lead_name}},\n\nSperăm că ai avut timp să parcurgi oferta pentru {{package_name}}.\n\n{{preferred_cta}}\n\nCu drag,\n{{company_name}}',
     1, TRUE),
    (v_client_id, v_sequence_id, 72, 'email', '72h date confirmation',
     'Disponibilitate dată — {{company_name}}',
     'Bună {{lead_name}},\n\nVrei să confirmăm disponibilitatea pentru data nunții?\n\n{{preferred_cta}}\n\nCu drag,\n{{company_name}}',
     2, TRUE),
    (v_client_id, v_sequence_id, 168, 'email', '7-day final reminder',
     'Reminder elegant — {{company_name}}',
     'Bună {{lead_name}},\n\nOferta pentru {{package_name}} rămâne deschisă. Suntem aici dacă ai întrebări.\n\n{{preferred_cta}}\n\nCu respect,\n{{company_name}}',
     3, TRUE);

END $$;
