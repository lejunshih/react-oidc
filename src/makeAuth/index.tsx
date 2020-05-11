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

      public componentDidMount() {
        this.getUser();
      }

      public getUser = () => {
        console.log("[custom] getting user");
        this.userManager
          .getUser()
          .then((user) => this.storeUser(user))
          .catch(() => this.setState({ isFetchingUser: false }));
      };

      public storeUser = (user: User) => {
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
            userLoaded: true,
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
        this.userManager
          .signinRedirect({ data: { args } })
          .then(() => {
            this.getUser();
          })
          .catch((e) => {
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
