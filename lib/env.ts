import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z
    .string()
    .min(16, "AUTH_SECRET must be at least 16 characters")
    .default("dev-only-auth-secret-minimum-32-chars-long-placeholder"),
  AUTH_URL: z.string().url().default("http://localhost:3000"),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Eventr Dispatch <noreply@eventr.pk>"),
  AUTH_TEST_TRANSPORT: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_NAME: z.string().optional(),
  TICKET_SIGNING_SECRET: z
    .string()
    .min(16, "TICKET_SIGNING_SECRET must be at least 16 characters")
    .default("dev-only-ticket-signing-secret-minimum-32-chars"),
  PII_ENCRYPTION_KEY: z
    .string()
    .min(16, "PII_ENCRYPTION_KEY must be at least 16 characters")
    .default("dev-only-pii-encryption-key-minimum-32-chars-00"),
  CRON_SECRET: z
    .string()
    .min(16, "CRON_SECRET must be at least 16 characters")
    .default("dev-only-cron-secret-minimum-32-chars-placeholder"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z
    .string()
    .min(1, "GEMINI_MODEL is required when calling Gemini")
    .refine((m) => !m.includes("1.5-flash"), {
      message:
        "gemini-1.5-flash is retired; configure a supported model such as gemini-2.5-flash",
    })
    .default("gemini-2.5-flash"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof serverEnvSchema>;

export function validateEnv(rawEnv: NodeJS.ProcessEnv = process.env): Env {
  const normalized: Record<string, string | undefined> = {
    ...rawEnv,
    DATABASE_URL:
      rawEnv.DATABASE_URL ||
      (rawEnv.NODE_ENV === "test"
        ? "postgresql://postgres:postgres@localhost:5432/eventr_test"
        : "postgresql://localhost:5432/eventr"),
    AUTH_SECRET: rawEnv.AUTH_SECRET || rawEnv.NEXTAUTH_SECRET || undefined,
    AUTH_GOOGLE_ID: rawEnv.AUTH_GOOGLE_ID || rawEnv.GOOGLE_CLIENT_ID || undefined,
    AUTH_GOOGLE_SECRET:
      rawEnv.AUTH_GOOGLE_SECRET || rawEnv.GOOGLE_CLIENT_SECRET || undefined,
    GEMINI_MODEL: rawEnv.GEMINI_MODEL || "gemini-2.5-flash",
  };

  for (const [k, v] of Object.entries(normalized)) {
    if (v === "") {
      normalized[k] = undefined;
    }
  }

  const parsed = serverEnvSchema.safeParse(normalized);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  if (parsed.data.NODE_ENV === "production") {
    // Never allow AUTH_TEST_TRANSPORT in production (even during build)
    if (parsed.data.AUTH_TEST_TRANSPORT || rawEnv.AUTH_TEST_TRANSPORT === "true") {
      throw new Error(
        "AUTH_TEST_TRANSPORT=true is forbidden when NODE_ENV=production. Magic-link tokens must never be written to disk in production."
      );
    }

    const isBuildPhase = rawEnv.NEXT_PHASE === "phase-production-build";
    if (!isBuildPhase) {
      const missingProd: string[] = [];
      if (!rawEnv.AUTH_SECRET && !rawEnv.NEXTAUTH_SECRET)
        missingProd.push("AUTH_SECRET");
      if (!rawEnv.TICKET_SIGNING_SECRET)
        missingProd.push("TICKET_SIGNING_SECRET");
      if (!rawEnv.PII_ENCRYPTION_KEY) missingProd.push("PII_ENCRYPTION_KEY");
      if (!rawEnv.CRON_SECRET) missingProd.push("CRON_SECRET");

      if (missingProd.length > 0) {
        throw new Error(
          `Missing required production secrets: ${missingProd.join(", ")}`
        );
      }

      if (!rawEnv.UPSTASH_REDIS_REST_URL || !rawEnv.UPSTASH_REDIS_REST_TOKEN) {
        console.warn(
          "[Eventr Security Warning] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured in production! Rate limiting is falling back to per-instance memory, which does not synchronize across serverless instances."
        );
      }
    }
  }

  return parsed.data;
}

export const env: Env = validateEnv(process.env);
