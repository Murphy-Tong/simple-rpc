import {
  ApiClient,
  DefaultAxiosRequestCoreImpl,
  createInstance,
  HttpRequestConfig,
  ChainedInterceptor,
} from "nethub";

async function getData(
  param: HttpRequestConfig,
  next: ChainedInterceptor<any>
) {
  return (await next(param)).data;
}

export default class ServerInterface {
  private clientImpl: ApiClient;
  private path = "";
  constructor(config: {
    host?: string;
    clientImpl?: ApiClient;
    path?: string;
  }) {
    this.path = config.path || this.path;
    this.clientImpl = config.clientImpl
      ? config.clientImpl
      : createInstance({
          host: config.host,
          requestCore: new DefaultAxiosRequestCoreImpl(),
          interceptors: [getData],
        });
  }

  create<T extends object = any>(name?: string) {
    return this.createModuleProxy<T>(name);
  }

  private applyHandler(module?: string, fn?: string, args?: any[]) {
    return this.clientImpl.execute({
      method: "POST",
      path: this.path,
      body: { module, args, fn },
    });
  }

  private createModuleProxy<T = any>(module?: string): T {
    return new Proxy(() => {}, {
      apply: (target, thisArg, argArray) => {
        return this.applyHandler(module, undefined, argArray);
      },
      get: (target, fn, receiver) => {
        return (...argArray: any) => {
          return this.applyHandler(module, fn as string, argArray);
        };
      },
    }) as T;
  }
}
