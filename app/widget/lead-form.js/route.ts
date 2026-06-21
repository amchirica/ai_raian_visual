import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const client = request.nextUrl.searchParams.get("client");
  if (!client) {
    return new NextResponse("/* Missing ?client= parameter */", {
      status: 400,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const height = request.nextUrl.searchParams.get("height") ?? "700";

  const script = `
(function () {
  var client = ${JSON.stringify(client)};
  var baseUrl = ${JSON.stringify(baseUrl)};
  var height = ${JSON.stringify(height)};
  var containerId = "lead-engine-" + client;
  if (document.getElementById(containerId)) return;
  var container = document.createElement("div");
  container.id = containerId;
  var script = document.currentScript;
  script.parentNode.insertBefore(container, script.nextSibling);
  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/embed/lead-form/" + client;
  iframe.width = "100%";
  iframe.height = height;
  iframe.style.border = "0";
  iframe.style.borderRadius = "12px";
  iframe.loading = "lazy";
  iframe.title = "Lead form";
  container.appendChild(iframe);
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
