import type { OfferContentData } from "@/types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOfferHtml(data: OfferContentData): string {
  const color = data.primary_color || "#2563eb";
  const extrasRows = data.extras
    .map(
      (e) =>
        `<tr><td>${escapeHtml(e.name)}</td><td style="text-align:right">${e.quantity}×</td><td style="text-align:right">${e.price.toFixed(0)} ${data.currency}</td></tr>`,
    )
    .join("");

  const featuresList = data.package_features
    .map((f) => `<li>${escapeHtml(f)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ofertă — ${escapeHtml(data.company_name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; background: #f8fafc; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: #fff; padding: 40px 48px; }
    .header-inner { display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { max-height: 56px; max-width: 160px; }
    .company { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .tagline { opacity: 0.9; margin-top: 6px; font-size: 14px; }
    .badge { background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 12px; }
    .body { padding: 40px 48px; }
    .greeting { font-size: 18px; margin-bottom: 24px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: ${color}; font-weight: 600; margin-bottom: 12px; }
    .package-name { font-size: 24px; font-weight: 700; color: #0f172a; }
    .package-desc { color: #64748b; margin-top: 8px; font-size: 14px; line-height: 1.6; }
    .price-box { background: #f1f5f9; border-radius: 10px; padding: 20px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .price-label { font-size: 13px; color: #64748b; }
    .price-value { font-size: 32px; font-weight: 800; color: ${color}; }
    ul.features { margin-top: 16px; padding-left: 20px; }
    ul.features li { margin-bottom: 6px; font-size: 14px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 10px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .total-row { font-weight: 700; font-size: 18px; }
    .total-row td { border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
    .section p { font-size: 14px; color: #475569; line-height: 1.7; }
    .cta { display: inline-block; background: ${color}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 8px; }
    .validity { font-size: 13px; color: #94a3b8; margin-top: 24px; }
    .footer { background: #f8fafc; padding: 24px 48px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
    .reason { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400e; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-inner">
        <div>
          ${data.logo_url ? `<img src="${escapeHtml(data.logo_url)}" alt="" class="logo" /><br/>` : ""}
          <div class="company">${escapeHtml(data.company_name)}</div>
        </div>
        <div class="badge">Ofertă personalizată</div>
      </div>
    </div>

    <div class="body">
      <p class="greeting">Bună ${escapeHtml(data.lead_name)},</p>

      ${data.recommendation_reason ? `<div class="reason">💡 ${escapeHtml(data.recommendation_reason)}</div>` : ""}

      <div class="card">
        <div class="card-title">Pachet recomandat</div>
        <div class="package-name">${escapeHtml(data.package_name)}</div>
        ${data.package_description ? `<p class="package-desc">${escapeHtml(data.package_description)}</p>` : ""}
        ${data.requested_service ? `<p class="package-desc" style="margin-top:12px"><strong>Serviciu solicitat:</strong> ${escapeHtml(data.requested_service)}</p>` : ""}
        <ul class="features">${featuresList}</ul>
        <div class="price-box">
          <div><div class="price-label">Preț pachet</div></div>
          <div class="price-value">${data.package_price.toFixed(0)} ${escapeHtml(data.currency)}</div>
        </div>
      </div>

      ${data.extras.length > 0 ? `
      <div class="card">
        <div class="card-title">Extra opționale</div>
        <table>
          <thead><tr><th>Serviciu</th><th style="text-align:right">Cant.</th><th style="text-align:right">Preț</th></tr></thead>
          <tbody>${extrasRows}</tbody>
        </table>
      </div>` : ""}

      <div class="card">
        <table>
          <tbody>
            <tr><td>Subtotal pachet</td><td style="text-align:right">${data.subtotal.toFixed(0)} ${data.currency}</td></tr>
            ${data.extras_total > 0 ? `<tr><td>Extra</td><td style="text-align:right">${data.extras_total.toFixed(0)} ${data.currency}</td></tr>` : ""}
            <tr class="total-row"><td>Total</td><td style="text-align:right;color:${color}">${data.total_amount.toFixed(0)} ${data.currency}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Termeni de livrare</h3>
        <p>${escapeHtml(data.delivery_terms)}</p>
      </div>

      <div class="section">
        <h3>Următorii pași</h3>
        <p>${escapeHtml(data.next_steps)}</p>
        ${data.cta_url ? `<a href="${escapeHtml(data.cta_url)}" class="cta">${escapeHtml(data.cta_text)}</a>` : `<span class="cta">${escapeHtml(data.cta_text)}</span>`}
      </div>

      <p class="validity">Ofertă valabilă până la: ${escapeHtml(data.valid_until)}</p>
    </div>

    <div class="footer">
      ${[data.contact_email, data.contact_phone, data.website].filter((v): v is string => !!v).map(escapeHtml).join(" · ")}
    </div>
  </div>
</body>
</html>`;
}

export function buildOfferEmailBody(data: OfferContentData): string {
  const extrasText = data.extras.length
    ? `\nExtra:\n${data.extras.map((e) => `- ${e.name}: ${e.price} ${data.currency}`).join("\n")}`
    : "";

  return `Bună ${data.lead_name},

Îți trimitem oferta personalizată de la ${data.company_name}.

Pachet recomandat: ${data.package_name}
Preț pachet: ${data.package_price} ${data.currency}
${extrasText}
Total: ${data.total_amount} ${data.currency}

${data.recommendation_reason ? `De ce acest pachet: ${data.recommendation_reason}\n` : ""}
Termeni livrare: ${data.delivery_terms}

${data.next_steps}

Ofertă valabilă până la: ${data.valid_until}

${data.cta_text}
${data.contact_email ? `Email: ${data.contact_email}` : ""}
${data.contact_phone ? `Tel: ${data.contact_phone}` : ""}`;
}

export function buildOfferTextSummary(data: OfferContentData): string {
  return `${data.company_name} | Ofertă ${data.package_name} | ${data.total_amount} ${data.currency} | Valabil: ${data.valid_until} | Lead: ${data.lead_name}`;
}

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
