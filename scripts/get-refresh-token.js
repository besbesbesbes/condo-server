import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
  //   "http://localhost:3000/oauth2callback"
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline", // important to get refresh token
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

console.log("Visit this URL to authorize the app:", authUrl);
