import fs from "fs";
import path from "path";
import { env } from "./env";

export interface OutboxEmail {
  to: string;
  from: string;
  subject: string;
  url?: string;
  html: string;
  sentAt: string;
}

const OUTBOX_PATH = path.join(process.cwd(), ".tmp", "test-emails.json");

export function readTestOutbox(): OutboxEmail[] {
  try {
    if (!fs.existsSync(OUTBOX_PATH)) return [];
    const raw = fs.readFileSync(OUTBOX_PATH, "utf8");
    return JSON.parse(raw) as OutboxEmail[];
  } catch {
    return [];
  }
}

export function clearTestOutbox(): void {
  try {
    if (fs.existsSync(OUTBOX_PATH)) {
      fs.unlinkSync(OUTBOX_PATH);
    }
  } catch {}
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  url?: string;
}): Promise<{ ok: boolean }> {
  const from = env.EMAIL_FROM || "Eventr Dispatch <noreply@eventr.pk>";
  const useTestTransport =
    env.AUTH_TEST_TRANSPORT ||
    process.env.AUTH_TEST_TRANSPORT === "true" ||
    env.NODE_ENV === "test" ||
    !env.RESEND_API_KEY ||
    env.RESEND_API_KEY.startsWith("re_fake");

  if (useTestTransport) {
    const dir = path.dirname(OUTBOX_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const existing = readTestOutbox();
    existing.unshift({
      to: params.to,
      from,
      subject: params.subject,
      url: params.url,
      html: params.html,
      sentAt: new Date().toISOString(),
    });
    fs.writeFileSync(OUTBOX_PATH, JSON.stringify(existing.slice(0, 50), null, 2), "utf8");
    return { ok: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend API responded with HTTP ${res.status}`);
  }

  return { ok: true };
}

