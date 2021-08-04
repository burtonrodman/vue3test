import { AxiosInstance } from "axios";

export default class AuthorizationService {
  public static ServiceKey = "AuthorizationService";
  private axios: AxiosInstance;
  private permissions: string[] = [];

  constructor(axiosInstance: AxiosInstance) {
    this.axios = axiosInstance;
  }

  hasPermission = (permission: string) => {
    if (this.permissions.length === 0) {
      this.axios.get("/api/permissions").then((result) => {
        this.permissions = result.data;
      });
    }

    return this.permissions.find((p) => p == permission) !== undefined;
  };
}
