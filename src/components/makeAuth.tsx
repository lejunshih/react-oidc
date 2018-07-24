import * as React from 'react'
import { User, UserManager } from 'oidc-client'

import RedirectToAuth from './RedirectToAuth'

export interface IAuthenticatorContext {
  user: User | null
  userManager: UserManager | null
}
const DEFAULT_CONTEXT: IAuthenticatorContext = {
  user: null,
  userManager: null
}
const { Consumer, Provider } = React.createContext<IAuthenticatorContext>(
  DEFAULT_CONTEXT
)

export interface IAuthenticatorState {
  isFetchingUser: boolean
  context: {
    user: User | null
    userManager: UserManager
  }
}
export interface IMakeAuthenticatorParams {
  placeholderComponent?: React.ReactNode
  userManagerInstance: UserManager
}
function makeAuthenticator({
  userManagerInstance,
  placeholderComponent
}: IMakeAuthenticatorParams) {
  return (WrappedComponent: React.ReactNode) => {
    return class Authenticator extends React.Component<
      {},
      IAuthenticatorState
    > {
      public userManager: UserManager
      constructor(props: {}) {
        super(props)
        this.userManager = userManagerInstance
        this.state = {
          context: {
            user: null,
            userManager: userManagerInstance
          },
          isFetchingUser: true
        }
      }

      public componentDidMount() {
        this.userManager
          .getUser()
          .then(user => this.storeUser(user))
          .catch(() => this.setState({ isFetchingUser: false }))
      }

      public storeUser = (user: User) => {
        if (user) {
          this.setState(({ context }) => ({
            context: { ...context, user },
            isFetchingUser: false
          }))
        } else {
          this.setState({ isFetchingUser: false })
        }
      }

      public isValid = () => {
        const { user } = this.state.context
        return !!(user && !user.expired)
      }

      public render() {
        if (this.state.isFetchingUser) {
          return placeholderComponent || <div>Fetching...</div>
        }
        return this.isValid() ? (
          <Provider value={this.state.context}>{WrappedComponent}</Provider>
        ) : (
          <RedirectToAuth userManager={this.userManager} />
        )
      }
    }
  }
}
export { Consumer, makeAuthenticator }