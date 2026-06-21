-- Raian Visual — AI Assistant demo (settings + FAQ knowledge base)
-- Run after 006_assistant_chat.sql

DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE slug = 'raian-visual';
  IF v_client_id IS NULL THEN RETURN; END IF;

  INSERT INTO assistant_settings (
    client_id, is_enabled, greeting_message, fallback_message, handoff_message,
    tone, lead_capture_prompt, lead_form_url, system_instructions, theme, metadata
  ) VALUES (
    v_client_id,
    TRUE,
    'Bună! Sunt asistentul virtual Raian Visual — studio premium foto & video de nuntă în Iași și Moldova. Te pot ajuta cu pachete, prețuri, livrare, proces de rezervare și disponibilitate. Cu ce te pot ajuta?',
    'Nu am această informație confirmată în baza noastră. Pot să îți iau datele de contact și revenim cu un răspuns de la echipă, sau poți completa formularul pentru o ofertă personalizată.',
    'Te pun în legătură cu echipa noastră. Lasă-ne numele, emailul și telefonul — revenim în cel mai scurt timp, de obicei în 24 de ore lucrătoare.',
    'premium, warm, direct, elegant, professional',
    'Vrei o ofertă personalizată? Lasă-ne numele, telefonul și emailul — verificăm disponibilitatea datei tale.',
    '/embed/lead-form/raian-visual',
    'Răspunde în română, ton premium dar cald și direct. Ești asistent virtual — menționează dacă ești întrebat. Nu confirma disponibilitate pe date concrete fără verificare calendar. Nu inventa prețuri — folosește doar pachetele și extra din baza de date. Nu oferi sfaturi medicale sau legale. CTA principal: Verifică disponibilitatea datei.',
    '{"primaryColor":"#7c3aed"}'::jsonb,
    '{
      "country": "Romania",
      "service_areas": ["Iași", "Moldova", "București", "Brașov", "Cluj", "Timișoara", "Constanța", "toată România — cu deplasare"],
      "primary_cta": "Verifică disponibilitatea datei",
      "contact_phone": "0740607882",
      "booking_process": "1) Completezi formularul sau ne contactezi 2) Discutăm detaliile nunții 3) Primești oferta personalizată 4) Semnezi contractul și plătești avansul 30% 5) Rezervăm data în calendar",
      "advance_payment": "Avans 30% la semnarea contractului pentru confirmarea datei. Restul — conform contractului."
    }'::jsonb
  )
  ON CONFLICT (client_id) DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    greeting_message = EXCLUDED.greeting_message,
    fallback_message = EXCLUDED.fallback_message,
    handoff_message = EXCLUDED.handoff_message,
    tone = EXCLUDED.tone,
    lead_capture_prompt = EXCLUDED.lead_capture_prompt,
    system_instructions = EXCLUDED.system_instructions,
    theme = EXCLUDED.theme,
    metadata = EXCLUDED.metadata;

  UPDATE business_profiles SET
    contact_email = COALESCE(contact_email, 'contact@raianvisual.ro'),
    contact_phone = '0740607882',
    website = COALESCE(website, 'https://raianvisual.ro')
  WHERE client_id = v_client_id;

  DELETE FROM faq_items WHERE client_id = v_client_id;

  INSERT INTO faq_items (client_id, question, answer, category, sort_order, is_active) VALUES
  (v_client_id, 'Care sunt pachetele și prețurile?',
   'Avem 4 pachete foto-video: Basic — 1399 EUR (8h, acoperire esențială); Essential — 1799 EUR (10h, standard recomandat); Signature — 2099 EUR (12h, cinematic + highlight); Exclusive — 2699 EUR (14h, echipă extinsă, album inclus). Pentru ofertă exactă pe data ta: Verifică disponibilitatea datei prin formular.',
   'Pachete', 1, TRUE),
  (v_client_id, 'În cât timp primim fotografiile și filmul? (timp de livrare)',
   'Fotografii editate: 30–45 zile lucrătoare de la eveniment. Film final (montaj complet): 60–90 zile. Preview rapid (extra): selecție foto în 48h. Termenele exacte se confirmă în contract.',
   'Livrare', 2, TRUE),
  (v_client_id, 'Care este procesul de rezervare?',
   '1) Completezi formularul sau ne contactezi la 0740607882  2) Discutăm detaliile nunții (dată, locație, pachet)  3) Primești oferta personalizată  4) Semnezi contractul și plătești avansul  5) Rezervăm data în calendar. CTA: Verifică disponibilitatea datei.',
   'Rezervare', 3, TRUE),
  (v_client_id, 'Cum funcționează avansul / plata?',
   'Avans 30% la semnarea contractului — confirmă rezervarea datei. Restul plății conform termenilor din contract (de obicei înainte sau la livrarea materialelor). Acceptăm transfer bancar; detaliile în contract.',
   'Plată', 4, TRUE),
  (v_client_id, 'Lucrați în afara Iașului? (deplasare / travel)',
   'Da. Acoperim Iași, Moldova și toată România. Pentru evenimente în afara zonei locale se poate aplica un cost de deplasare — confirmăm transparent în ofertă, înainte de contract.',
   'Zone', 5, TRUE),
  (v_client_id, 'Oferiți filmare cu dronă?',
   'Da. Filmarea cu dronă este disponibilă ca extra — 150 EUR. Include cadre aeriene (locație, exterior), în funcție de condițiile meteo și reglementările locale. Nu este inclusă implicit în pachetele de bază.',
   'Extra', 6, TRUE),
  (v_client_id, 'Livrați film în 4K?',
   'Da. Livrarea 4K este inclusă în pachetul Exclusive. Pentru Basic, Essential sau Signature, livrarea 4K poate fi adăugată ca extra — 100 EUR.',
   'Livrare', 7, TRUE),
  (v_client_id, 'Ce este highlight film-ul și ce lungime are?',
   'Highlight film = film scurt cinematic (3–7 min în funcție de pachet) cu cele mai emoționante momente. Basic: 3–4 min; Essential: 5–6 min; Signature: 6–7 min; Exclusive: 8–10 min + 4K. Film complet (ceremonie + petrecere) se livrează separat, 60–90 zile.',
   'Livrare', 8, TRUE),
  (v_client_id, 'Pot adăuga un al doilea fotograf sau videograf?',
   'Da. Al doilea fotograf — 200 EUR; al doilea videograf — 250 EUR. Pachetul Exclusive include deja 2 fotografi și 2 videografi. Recomandat pentru evenimente cu mulți invitați sau locații extinse.',
   'Extra', 9, TRUE),
  (v_client_id, 'Includeți album foto?',
   'Albumul foto premium (30x30cm) este inclus în pachetul Exclusive. Pentru celelalte pachete, albumul poate fi adăugat ca extra — 180 EUR (30 pagini, design personalizat).',
   'Album', 10, TRUE),
  (v_client_id, 'Câte fotografii primim?',
   'Basic: 250+ fotografii editate; Essential: 350+; Signature: 450+; Exclusive: 550+. Toate în galerie online privată, descărcare HD. Numărul exact variază cu durata acoperirii și dinamica evenimentului.',
   'Livrare', 11, TRUE),
  (v_client_id, 'Câte ore lucrați / program acoperire?',
   'Basic: ~8h (ex. 10:00–18:00); Essential: ~10h; Signature: ~12h; Exclusive: ~14h (ex. 07:00–21:00). Orele exacte se stabilesc împreună, în funcție de programul nunții. Oră suplimentară — extra 120 EUR.',
   'Acoperire', 12, TRUE),
  (v_client_id, 'Cum verific disponibilitatea pentru data nunții?',
   'Completează formularul cu data nunții sau contactează-ne la 0740607882 / contact@raianvisual.ro. Verificăm calendarul și revenim cu confirmare — nu putem garanta disponibilitatea fără verificare.',
   'Rezervare', 13, TRUE);

  UPDATE widget_settings SET
    title = 'Asistent Raian Visual',
    subtitle = 'Întreabă despre pachete, prețuri și disponibilitate',
    theme = '{"primaryColor":"#7c3aed"}'::jsonb
  WHERE client_id = v_client_id AND widget_type = 'chat';

END $$;
