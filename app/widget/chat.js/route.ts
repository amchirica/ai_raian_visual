import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientFromQuery = request.nextUrl.searchParams.get("client");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const mode = request.nextUrl.searchParams.get("mode") ?? "floating";

  const script = `
(function () {
  if (window.__aiAssistantLoaded) return;
  window.__aiAssistantLoaded = true;
  var script = document.currentScript;
  var client = ${JSON.stringify(clientFromQuery)} || (script && script.getAttribute("data-client"));
  if (!client) {
    console.error("[AI Assistant] Missing client. Use ?client=slug or data-client attribute.");
    return;
  }
  var baseUrl = ${JSON.stringify(baseUrl)};
  var mode = ${JSON.stringify(mode)};
  var containerId = "ai-assistant-" + client;
  if (document.getElementById(containerId)) return;
  var container = document.createElement("div");
  container.id = containerId;
  container.style.cssText = "all:initial;position:fixed;bottom:0;right:0;z-index:2147483647;pointer-events:none;";
  document.body.appendChild(container);
  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/embed/chat/" + client;
  iframe.style.cssText = mode === "floating"
    ? "position:fixed;bottom:20px;right:20px;width:380px;height:520px;border:0;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);pointer-events:auto;"
    : "width:100%;height:560px;border:0;border-radius:12px;pointer-events:auto;";
  iframe.allow = "clipboard-write";
  iframe.title = "AI Assistant";
  container.appendChild(iframe);
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
