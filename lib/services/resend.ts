const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendResendEmail({
  subject,
  html,
  to,
}: {
  subject: string;
  html: string;
  to: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ops@rudore.africa",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend error: ${response.status} ${message}`);
  }

  return response.json();
}
