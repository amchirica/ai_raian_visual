import { NextResponse } from "next/server";

export async function GET() {
  const script = `
(function () {
  var script = document.currentScript;
  var client = script.getAttribute("data-client");
  var widget = script.getAttribute("data-widget") || "lead-form";
  var baseUrl = script.src.replace("/embed/widget.js", "");
  var containerId = "ai-platform-widget-" + client + "-" + widget;
  var existing = document.getElementById(containerId);
  if (existing) return;
  var container = document.createElement("div");
  container.id = containerId;
  script.parentNode.insertBefore(container, script.nextSibling);
  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/embed/" + client + "/" + widget;
  iframe.width = "100%";
  iframe.height = script.getAttribute("data-height") || "600";
  iframe.style.border = "0";
  iframe.style.borderRadius = "12px";
  iframe.loading = "lazy";
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
