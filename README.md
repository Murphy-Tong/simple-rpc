```typescript

class HostDecor extends NetHubMethodDecorator<string> {
  collectMethodWithValue(value: string) {
    return function (config: HttpRequestConfig) {
      config.host = value;
      return config;
    };
  }
}

const Host: IDecoratorWithValue<MethodDecorator> = new HostDecor().regist();

@Service
class CDService {
  @Host("https://aaaa.com")
  @GET('/xxx/xxxx')
  aa(@QueryMap req: any): Promise<any[]> {
    throw new Error();
  }

  @POST('/xxx/xxxx')
  bb(@FieldMap f: any): Promise<boolean> {
    throw new Error();
  }
}

export default new NetHub()
  .setClient(createInstance(process.env.host, true))
  .create(CDService);

```