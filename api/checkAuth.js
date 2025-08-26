import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res
        .status(401)
        .json({ authorized: false, error: "Missing token" });
    }

    // Verify the ID token against your Google OAuth Client ID
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID, // your Google OAuth client ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (email === process.env.AUTHORIZED_USER) {
      return res.status(200).json({ authorized: true, email });
    } else {
      return res.status(403).json({ authorized: false, error: "Not allowed" });
    }
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ authorized: false, error: "Invalid token" });
  }
}
