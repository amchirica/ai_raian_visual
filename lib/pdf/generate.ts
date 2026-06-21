import type { BusinessProfile, Offer, OfferContentData } from "@/types";
import { buildOfferHtml } from "@/lib/offers/template";

export interface OfferPdfInput {
  offer: Offer;
  profile: BusinessProfile;
}

export interface PdfResult {
  buffer: Buffer;
  filename: string;
}

export async function generateOfferPdf(input: OfferPdfInput): Promise<PdfResult> {
  const content = input.offer.content_json as unknown as OfferContentData;
  const html = input.offer.content_html ?? buildOfferHtml({
    ...content,
    company_name: content.company_name || input.profile.company_name,
    logo_url: content.logo_url ?? input.profile.logo_url,
    primary_color: content.primary_color || input.profile.primary_color || "#2563eb",
    contact_email: content.contact_email ?? input.profile.contact_email,
    contact_phone: content.contact_phone ?? input.profile.contact_phone,
    website: content.website ?? input.profile.website,
  });

  const filename = `offer-${input.offer.offer_number ?? input.offer.id}.pdf`;

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const buffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      }),
    );
    await browser.close();

    return { buffer, filename };
  } catch {
    const buffer = Buffer.from(html, "utf-8");
    return { buffer, filename: filename.replace(".pdf", ".html") };
  }
}
