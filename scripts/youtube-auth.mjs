// One-time sign-in for scripts/youtube-sync.mjs: lets the OGTV YouTube channel's playlists be managed by the nightly job.
// 1. In Google Cloud (console.cloud.google.com): a project, YouTube Data API v3 enabled, an OAuth consent screen
//    (External, publishing status "In production", or the sign-in lapses after 7 days), and an OAuth client of type
//    "Desktop app". Copy its client ID and secret.
// 2. Here: YT_CLIENT_ID=... YT_CLIENT_SECRET=... node scripts/youtube-auth.mjs
//    It prints a Google link: open it, choose the OGTV channel's account, allow. The browser comes back here.
// 3. It prints a refresh token. In GitHub: Settings > Secrets and variables > Actions > New repository secret, three of
//    them: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN. Nothing is saved on this computer or in the repository.
import http from "node:http";
import crypto from "node:crypto";
const {YT_CLIENT_ID: ID, YT_CLIENT_SECRET: SECRET} = process.env;
if (!ID || !SECRET) { console.error("Set YT_CLIENT_ID and YT_CLIENT_SECRET first (see the top of this file)."); process.exit(1) }
const verifier = crypto.randomBytes(32).toString("base64url"), challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1"), code = u.searchParams.get("code");
  if (!code) { res.end("No code: " + (u.searchParams.get("error") || "try again")); return }
  const r = await (await fetch("https://oauth2.googleapis.com/token", {method: "POST", headers: {"content-type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({client_id: ID, client_secret: SECRET, code, code_verifier: verifier, grant_type: "authorization_code", redirect_uri: redirect})})).json();
  res.end(r.refresh_token ? "Done: go back to the terminal." : "No refresh token: " + (r.error_description || r.error));
  console.log(r.refresh_token ? `\nYT_REFRESH_TOKEN (add it as a repository secret, with YT_CLIENT_ID and YT_CLIENT_SECRET):\n\n${r.refresh_token}\n` : r);
  server.close();
});
let redirect = "";
server.listen(0, "127.0.0.1", () => {
  redirect = `http://127.0.0.1:${server.address().port}`;
  console.log("Open this link, choose the OGTV channel, and allow:\n\n" + "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({client_id: ID, redirect_uri: redirect,
    response_type: "code", scope: "https://www.googleapis.com/auth/youtube", access_type: "offline", prompt: "consent", code_challenge: challenge, code_challenge_method: "S256"}));
});
