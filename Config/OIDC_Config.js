"use strict";
import dotenv from "dotenv";
dotenv.config();

export const OIDC_Config = {
  authorizationURL: `${process.env.AUTH_URL}`,
  tokenURL: `${process.env.TOKEN_URL}`,
  clientID: `${process.env.CLIENT_ID}`,
  clientSecret: `${process.env.CLIENT_SECRET}`,
  callbackURL: `${process.env.APP_LOGIN_URL}:${process.env.PORT}/OAuth/callback`,
  logoutURL: `${process.env.LOGOUT_URL}`,
};
