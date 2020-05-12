import * as React from "react";
import { User, UserManager } from "oidc-client";

export interface IAuthenticatorContext {
  signIn: (args: any) => void;
  signOut: () => void;
  user: User | null;
  userManager: UserManager | null;
}
const DEFAULT_CONTEXT: IAuthenticatorContext = {
  signIn: (args: any) => {},
  signOut: () => {},
  user: null,
  userManager: null,
};
const AuthenticatorContext = React.createContext<IAuthenticatorContext>(
  DEFAULT_CONTEXT
);

export const useReactOidc = () => {
  return React.useContext(AuthenticatorContext);
};

export interface IAuthenticatorState {
  isFetchingUser: boolean;
  userLoaded: boolean;
  context: {
    signIn: (args: any) => void;
    signOut: () => void;
    user: User | null;
    userManager: UserManager;
  };
}
export interface IMakeAuthenticatorParams {
  placeholderComponent?: React.ReactNode;
  userManager: UserManager;
  signinArgs?: any;
}
function makeAuthenticator({
  userManager,
  placeholderComponent,
  signinArgs,
}: IMakeAuthenticatorParams) {
  return <Props extends {}>(WrappedComponent: React.ComponentType<Props>) => {
    return class Authenticator extends React.Component<
      Props,
      IAuthenticatorState
    > {
      public userManager: UserManager;
      public signinArgs: any;
      constructor(props: Props) {
        super(props);
        const um = userManager;
        this.userManager = um;
        this.signinArgs = signinArgs;
        this.state = {
          context: {
            signOut: this.signOut,
            signIn: this.signIn,
            user: null,
            userManager: um,
          },
          isFetchingUser: true,
          userLoaded: false,
        };
      }

      public onSilentRenewError(e) {
        console.info("Silent renew error... removing user", e);
      }

      public onUserLoaded() {
        console.info("User loaded, getting user");
        this.getUser();
      }

      public onUserUnloaded() {
        console.info("User unloaded, getting user");

        this.getUser();
      }

      public onAccessTokenExpiring() {
        console.info("expiring... signing in silent");
        this.userManager
          .signinSilent()
          .then(() => {
            this.getUser();
          })
          .catch((e) => {
            console.warn("error occured while silent renewing", e);
          });
      }

      public onAccessTokenExpired() {
        console.info("Expired, deleting user from local");
        this.userManager
          .signinSilent()
          .then(() => {
            this.getUser();
          })
          .catch((e) => {
            console.warn(
              "error occured while silent renewing user after access token expired",
              e
            );
            console.warn("removing user now");
            this.userManager.removeUser().catch(() => {});
          });
      }

      public loadUserManager() {
        this.userManager.events.addSilentRenewError(
          this.onSilentRenewError.bind(this)
        );
        this.userManager.events.addUserLoaded(this.onUserLoaded.bind(this));
        this.userManager.events.addUserUnloaded(this.onUserUnloaded.bind(this));
        this.userManager.events.addAccessTokenExpiring(
          this.onAccessTokenExpiring.bind(this)
        );
        this.userManager.events.addAccessTokenExpired(
          this.onAccessTokenExpired.bind(this)
        );
      }

      public unloadUserManager() {
        this.userManager.events.removeSilentRenewError(this.onSilentRenewError);
        this.userManager.events.removeUserLoaded(this.onUserLoaded);
        this.userManager.events.removeUserUnloaded(this.onUserUnloaded);
        this.userManager.events.removeAccessTokenExpiring(
          this.onAccessTokenExpiring
        );
        this.userManager.events.removeAccessTokenExpired(
          this.onAccessTokenExpired
        );
      }

      public componentDidMount() {
        this.loadUserManager();
        console.log("[custom] component did mount");
        this.getUser(true).then((user) => {
          if (!user) {
            console.log("no user found, trying silent renew");
            this.userManager.signinSilent().catch((e) => {
              console.warn(
                "User does not exist, so therefore must not be logged in",
                e
              );
              this.getUser();
            });
          }
        });
      }

      public componentWillUnmount() {
        this.unloadUserManager();
      }

      public getUser = (initial = false) => {
        console.log("[custom] getting user");
        return this.userManager
          .getUser()
          .then((user) => {
            this.storeUser(user, initial);
            return user;
          })
          .catch((e) => {
            console.warn("something went wrong while getting user", e);
            this.setState({ isFetchingUser: false });
          });
      };

      public storeUser = (user: User, initial = false) => {
        console.log("storing user", user);
        if (user) {
          this.setState(({ context }) => ({
            context: { ...context, user },
            isFetchingUser: false,
            userLoaded: true,
          }));
        } else {
          this.setState(({ context }) => ({
            context: { ...context, user: null },
            isFetchingUser: false,
            userLoaded: !this.state.userLoaded && initial ? false : true,
          }));
        }
      };

      public signOut = () => {
        this.userManager
          .signoutRedirect()
          .then(() => {
            this.userManager.removeUser();
            this.getUser();
          })
          .catch((e) => {
            console.warn("error occurred while signing out", e);
          });
      };

      public signIn = async (args: any) => {
        console.log("signing in..");
        this.userManager.signinRedirect({ data: { args } }).catch((e) => {
          console.warn("error occured while signing in", e);
        });
      };

      public isValid = () => {
        const { user } = this.state.context;
        return !!(user && !user.expired);
      };

      public render() {
        if (this.state.isFetchingUser || !this.state.userLoaded) {
          return placeholderComponent || null;
        }

        return (
          <AuthenticatorContext.Provider value={this.state.context}>
            <WrappedComponent {...this.props} />
          </AuthenticatorContext.Provider>
        );
      }
    };
  };
}
export { AuthenticatorContext, makeAuthenticator };
