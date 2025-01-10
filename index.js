import express from "express";
import passport from "passport";
import OAuth2Strategy from "passport-oauth2";
import morgan from "morgan";
import dotenv from "dotenv";
import https from "https";
import fs from "fs";
import logger from "./Config/logger.js";
import session from "express-session";
import jwt from "jsonwebtoken";
import { OIDC_Config } from "./Config/OIDC_Config.js";
import pkceChallenge from "pkce-challenge";

dotenv.config();

const app = express();
app.use(morgan(":method :url :status - :response-time ms"));

/* ---------- SSL SETUP ---------- */
const privateKey = fs.readFileSync(
  "Certificates/SSL_certificate/private.key",
  "utf8"
);
const certificate = fs.readFileSync(
  "Certificates/SSL_certificate/certificate.crt",
  "utf8"
);
const credentials = { key: privateKey, cert: certificate };

app.use(
  session({
    name: "OIDC_Session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
    },
  })
);

// Generate PKCE challenge
const { code_verifier, code_challenge } = pkceChallenge();

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: `${OIDC_Config?.authorizationURL}?code_challenge=${code_challenge}&code_challenge_method=S256`,
      tokenURL: OIDC_Config?.tokenURL,
      clientID: OIDC_Config?.clientID,
      clientSecret: OIDC_Config?.clientSecret,
      callbackURL: OIDC_Config?.callbackURL,
      scope: ["email", "profile"],
    },
    async (accessToken, refreshToken, profile, done) => {
      logger.success(`OAuth Response: ${JSON.stringify(accessToken)}`);

      if (accessToken) {
        const decodeData = jwt.decode(accessToken);
        profile.email = decodeData?.upn;
        profile.name = decodeData?.unique_name;
      }
      // Ensure user object is properly structured
      if (!accessToken) {
        return done(new Error("No access token received"));
      }

      const user = { accessToken, profile };
      return done(null, user);
    }
  )
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((accessToken, done) => {
  const user = { accessToken }; // Reconstruct user object
  done(null, user);
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OAuth Authentication</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin: 100px;
            }
            h1 {
                color: #333;
            }
            .btn {
                background-color: #007BFF;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            .btn:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <h1>OAuth Authentication</h1>
        <button class="btn" onclick="window.location.href='/auth'">Login with OAuth</button>
    </body>
    </html>
  `);
});

app.get("/auth", (req, res, next) => {
  req.session.code_verifier = code_verifier; // Store code_verifier in session
  passport.authenticate("oauth2")(req, res, next);
});

app.get(
  "/OAuth/callback",
  passport.authenticate("oauth2", {
    failureRedirect: "/",
    successRedirect: "/dashboard",
  })
);

//  Dashboard page
app.get("/dashboard", (req, res) => {
  if (!req.user || !req.user.accessToken) {
    return res.redirect("/");
  }
  console.log("User:", req.user);
  const name = req.user?.accessToken?.profile?.name;
  const email = req.user?.accessToken?.profile?.email;
  res.send(
    `Welcome to your dashboard!
    <br/>Username: ${name} <br/> Email: ${email}
    <br/><a href="/logout">Logout</a></div>`
  );
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect(OIDC_Config?.logoutURL);
  });
});

/* ------------ SERVER START ------------ */
const PORT = process.env.PORT;
const HOST = "0.0.0.0";
// Use HTTPS to create the server
https.createServer(credentials, app).listen(PORT, HOST, () => {
  logger.info(`Server started and listening on https://localhost:${PORT}`);
  logger.warn(
    `Server running with machine IP: ${process.env.APP_LOGIN_URL}:${PORT}`
  );
});
