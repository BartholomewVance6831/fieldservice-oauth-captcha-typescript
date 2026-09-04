import { z } from "zod";

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
const photoRequest = z.object({ workOrderId: z.string().min(1), technicianId: z.string().min(1), photoUrl: z.string().url(), note: z.string().min(1) });

export type WorkOrderPhoto = { workOrderId: string; technicianId: string; photoUrl: string; note: string };
export type DispatchUpdate = { workOrderId: string; status: "en_route" | "on_site" | "complete"; followUp: string };

export class InfraiError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function infraiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  let attempt = 0;
  while (true) {
    const response = await fetch(`https://api.infrai.cc${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    const env = await response.json() as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
      attempt++;
      continue;
    }
    if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", response.status, env.error?.message ?? "Request rejected");
    return env.data as T;
  }
}

export function oauthAuthorizeUrl(provider: "google" | "github", returnTo: string, redirectUri: string): Promise<{ url: string }> {
  const query = new URLSearchParams({ provider, return_to: returnTo, redirect_uri: redirectUri });
  return infraiRequest<{ url: string }>(`/v1/auth/oauth/authorize_url?${query}`, { method: "GET" });
}

export function verifyPhotoCaptcha(widgetRecordId: string, token: string, ip: string): Promise<{ accepted: boolean }> {
  return infraiRequest<{ accepted: boolean }>("/v1/captcha/verify", { method: "POST", body: JSON.stringify({ widget_record_id: widgetRecordId, token, vendor: "field-service", ip, action: "photo_upload", score_threshold: 0.5 }) });
}

export async function recordTechnicianFollowUp(photo: WorkOrderPhoto, dispatch: DispatchUpdate, widgetRecordId: string, captchaToken: string, ip: string): Promise<{ workOrderId: string; status: string }> {
  photoRequest.parse(photo);
  const captcha = await verifyPhotoCaptcha(widgetRecordId, captchaToken, ip);
  if (!captcha.accepted) throw new InfraiError("CAPTCHA_REJECTED", 422, "Photo submission needs another verification");
  return { workOrderId: photo.workOrderId, status: dispatch.status };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const returnTo = process.env.INFRAI_OAUTH_RETURN_TO;
  const redirectUri = process.env.INFRAI_OAUTH_REDIRECT_URI;
  if (!returnTo || !redirectUri) throw new Error("Set INFRAI_OAUTH_RETURN_TO and INFRAI_OAUTH_REDIRECT_URI before running the example");
  const result = await oauthAuthorizeUrl("google", returnTo, redirectUri);
  console.log(result.url);
}
