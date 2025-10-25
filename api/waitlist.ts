const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 320) {
    return null;
  }
  return EMAIL_REGEX.test(normalized) ? normalized : null;
}

async function insertEmailToWaitlist(email: string): Promise<Response> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration");
  }

  const endpoint = new URL("/rest/v1/waitlist_signups", supabaseUrl).toString();
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify([{ email }]),
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const emailInput = typeof req.body === "string" ? JSON.parse(req.body).email : req.body?.email;
  const email = parseEmail(emailInput);

  if (!email) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }

  try {
    const response = await insertEmailToWaitlist(email);

    if (response.status === 409) {
      res.status(409).json({ error: "This email is already on the waitlist." });
      return;
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(async () => {
        const text = await response.text().catch(() => "");
        return text ? { message: text } : null;
      })) as Record<string, unknown> | null;

      const errorMessage =
        (typeof errorBody?.message === "string" && errorBody.message) ||
        (typeof errorBody?.error === "string" && errorBody.error) ||
        "Unable to save your email right now. Please try again.";

      console.error("[Waitlist] Failed to insert email (Vercel)", {
        status: response.status,
        error: errorBody,
      });

      const status = response.status >= 400 && response.status < 600 ? response.status : 500;
      res.status(status).json({ error: errorMessage });
      return;
    }

    res.status(201).json({ message: "Thanks for your interest! We'll reach out soon." });
  } catch (error) {
    console.error("[Waitlist] Unexpected error (Vercel)", error);
    res.status(500).json({ error: "Unexpected error while saving your email." });
  }
}
