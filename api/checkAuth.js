import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Whitelisted users who can access
const ALLOWED_USERS = ["davidlefu@gmail.com", "xxxxx1@gmail.com"];

// Your Google OAuth2 client ID (from Google Cloud console)
const CLIENT_ID =
  "1041756360894-9fqah9862k69mitthrvfa8k8u5n5506f.apps.googleusercontent.com";

const oauthClient = new OAuth2Client(CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idToken, action } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing ID token" });
    }

    // Verify Google ID token
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userEmail = payload.email;

    // Check whitelist
    if (!ALLOWED_USERS.includes(userEmail)) {
      return res.status(403).json({ error: "Unauthorized", authorized: false });
    }

    // If no action, just confirm user is authorized
    if (!action) {
      return res.status(200).json({ authorized: true });
    }

    // If action === getData → fetch Google Sheets
    if (action === "getData") {
      const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), // fix escaped newlines
        ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      );

      const sheets = google.sheets({ version: "v4", auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "'session check'!B2:I13", // 👈 same as original index.html
      });

      return res.status(200).json({
        authorized: true,
        values: response.data.values || [],
      });
    }

    // Unknown action
    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("checkauth.js error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
