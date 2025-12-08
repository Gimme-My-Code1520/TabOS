import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing url parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URL is http or https
    try {
      const parsed = new URL(targetUrl);
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the target URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    // If it's HTML, transform relative URLs and inject proxy awareness
    let content = text;
    if (contentType.includes("text/html")) {
      content = transformHtml(text, targetUrl);
    }

    return new Response(
      JSON.stringify({
        content,
        contentType,
        url: response.url,
        status: response.status,
        title: extractTitle(content),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        message: "Failed to fetch the URL",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function transformHtml(html: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const baseOrigin = base.origin;

  // Transform relative URLs in src and href attributes
  let transformed = html
    .replace(/src=["'](\/[^"']*)["']/g, (match, path) => {
      return `src="${baseOrigin}${path}"`;
    })
    .replace(/href=["'](\/[^"']*)["']/g, (match, path) => {
      return `href="${baseOrigin}${path}"`;
    })
    .replace(/src=["'](?!http)["']([^"']*)["']/g, (match, url) => {
      if (!url.startsWith("data:")) {
        const resolved = new URL(url, baseUrl).href;
        return `src="${resolved}"`;
      }
      return match;
    })
    .replace(/href=["'](?!http)["']([^"']*)["']/g, (match, url) => {
      if (!url.startsWith("#") && !url.startsWith("javascript:")) {
        const resolved = new URL(url, baseUrl).href;
        return `href="${resolved}"`;
      }
      return match;
    });

  // Disable external scripts
  transformed = transformed.replace(
    /<script[^>]*src=["'](?!data:)[^"']*["'][^>]*><\/script>/gi,
    ""
  );

  return transformed;
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "Untitled";
}
