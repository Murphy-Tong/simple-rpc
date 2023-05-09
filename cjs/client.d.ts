import { ApiClient } from "nethub";
export default class ServerInterface {
    private clientImpl;
    private path;
    constructor(config: {
        host?: string;
        clientImpl?: ApiClient;
        path?: string;
    });
    create<T extends object = any>(name?: string): T;
    private applyHandler;
    private createModuleProxy;
}
