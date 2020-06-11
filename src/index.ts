import {
  AuthenticatorContext as UserData,
  makeAuthenticator,
  useReactOidc,
} from "./makeAuth";
import makeUserManager from "./makeUserManager";
import Callback, { SilentCallback } from "./Callback";
import { Log } from "oidc-client";

const setOidcLogLevel = (level: number = Log.INFO) => {
  Log.level = level;
};

export {
  Callback,
  UserData,
  makeAuthenticator,
  makeUserManager,
  useReactOidc,
  SilentCallback,
  setOidcLogLevel,
};
