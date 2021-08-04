import axios, { AxiosInstance } from "axios";
import {
  UserManager,
  WebStorageStateStore,
  User,
  UserManagerSettings,
} from "oidc-client";
import { IAuthenticationService } from "./IAuthenticationService";

export default class AuthenticationService implements IAuthenticationService {
  private userManager: UserManager;
  private _axios?: AxiosInstance;
  public get AxiosInstance(): AxiosInstance {
    if (!this._axios) {
      const instance = axios.create();
      const logout = () => {
        this.logout();
      };
      instance.interceptors.response.use(
        function (response) {
          return response;
        },
        function (error) {
          if (error.response.status === 401) {
            logout();
            return Promise.reject(error);
          }
        }
      );
      this._axios = instance;
    }
    return this._axios;
  }

  constructor(axios?: AxiosInstance) {
    const settings: UserManagerSettings = {
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      authority: window.Config.identityServer?.domain,
      client_id: window.Config.identityServer?.clientId,
      redirect_uri: window.Config.app?.domain + "/callback.html",
      response_type: "id_token",
      scope: "openid profile",
      post_logout_redirect_uri: window.Config.app?.domain + "/",
      filterProtocolClaims: true,
    };
    this.userManager = new UserManager(settings);
    this._axios = axios;
  }

  public getUser(): Promise<User | null> {
    return this.userManager.getUser();
  }

  public login(): Promise<void> {
    return this.userManager.signinRedirect();
  }

  public logout(): Promise<void> {
    return this.userManager.signoutRedirect();
  }

  public async isLoggedIn(): Promise<boolean> {
    const user: User | null = await this.getUser();

    const loggedIn = user !== null && !user.expired;
    if (loggedIn) {
      this.setTokenOnHeaders(user?.id_token);
    }

    return loggedIn;
  }

  setTokenOnHeaders(accessToken: string | undefined) {
    if (accessToken) {
      this.AxiosInstance.defaults.baseURL = window.Config.api?.domain;
      this.AxiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      this.AxiosInstance.defaults.headers.common.Authorization = undefined;
    }
  }

  handleUnauthorized = (args: any) => {
    if (args.error.error.status === 401) {
      this.login();
    }
  };

  getAjaxHeaders() {
    return [
      {
        Authorization: this.AxiosInstance.defaults.headers.common.Authorization,
      },
    ];
  }
}
