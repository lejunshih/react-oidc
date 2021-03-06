import * as React from "react";
import {
  User,
  UserManager,
  UserManagerSettings,
  SignoutResponse,
} from "oidc-client";

export interface ICallbackProps {
  onSuccess?: (user: User) => void;
  onError?: (err: any) => void;
  userManager: UserManager;
}

export interface ILogoutCallbackProps {
  onSuccess?: (response: SignoutResponse) => void;
  onError?: (err: any) => void;
  userManager: UserManager;
}

class Callback extends React.Component<ICallbackProps> {
  public componentDidMount() {
    const { onSuccess, onError, userManager } = this.props;

    const um = userManager;
    um.signinRedirectCallback()
      .then((user) => {
        if (onSuccess) {
          onSuccess(user);
        }
      })
      .catch((err) => {
        if (onError) {
          onError(err);
        }
      });
  }
  public render() {
    return this.props.children || null;
  }
}
export class SilentCallback extends React.Component<ICallbackProps> {
  public componentDidMount() {
    const { onSuccess, onError, userManager } = this.props;

    const um = userManager;
    um.signinSilentCallback()
      .then((user) => {
        if (onSuccess) {
          onSuccess(user);
        }
      })
      .catch((err) => {
        if (onError) {
          onError(err);
        }
      });
  }
  public render() {
    return this.props.children || null;
  }
}

export class LogoutCallback extends React.Component<ILogoutCallbackProps> {
  public componentDidMount() {
    const { onSuccess, onError, userManager } = this.props;

    const um = userManager;
    um.signoutRedirectCallback()
      .then((user) => {
        if (onSuccess) {
          onSuccess(user);
        }
      })
      .catch((err) => {
        if (onError) {
          onError(err);
        }
      });
  }
  public render() {
    return this.props.children || null;
  }
}

export default Callback;
