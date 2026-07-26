export const ANALYTICS_EVENTS = [
  "landing_view",
  "editor_opened",
  "template_created",
  "png_previewed",
  "get_url_copied",
  "sign_in",
  "template_claimed",
  "waitlist_signup",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

const SESSION_KEY = "coverkit_sid";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Fire-and-forget client analytics. Never throws to callers. */
export function track(
  name: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === "undefined") return;

  const body = {
    name,
    properties: properties ?? {},
    sessionId: getAnalyticsSessionId(),
  };

  const payload = JSON.stringify(body);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }
  } catch {
    // fall through to fetch
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    /* ignore */
  });
}
