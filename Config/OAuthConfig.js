"use strict";
import dotenv from "dotenv";
dotenv.config();

export const OAuthConfig = {
  authorizationURL: `${process.env.AUTH_URL}`,
  tokenURL: `${process.env.TOKEN_URL}`,
  clientID: `${process.env.CLIENT_ID}`,
  clientSecret: `${process.env.CLIENT_SECRET}`,
  callbackURL: `${process.env.APP_LOGIN_URL}:${process.env.PORT}/OAuth/callback`,
};

console.log("CB", OAuthConfig?.callbackURL);
