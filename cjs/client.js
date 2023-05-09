"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nethub_1 = require("nethub");
function getData(param, next) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield next(param)).data;
    });
}
class ServerInterface {
    constructor(config) {
        this.path = "";
        this.path = config.path || this.path;
        this.clientImpl = config.clientImpl
            ? config.clientImpl
            : (0, nethub_1.createInstance)({
                host: config.host,
                requestCore: new nethub_1.DefaultAxiosRequestCoreImpl(),
                interceptors: [getData],
            });
    }
    create(name) {
        return this.createModuleProxy(name);
    }
    applyHandler(module, fn, args) {
        return this.clientImpl.execute({
            method: "POST",
            path: this.path,
            body: { module, args, fn },
        });
    }
    createModuleProxy(module) {
        return new Proxy(() => { }, {
            apply: (target, thisArg, argArray) => {
                return this.applyHandler(module, undefined, argArray);
            },
            get: (target, fn, receiver) => {
                return (...argArray) => {
                    return this.applyHandler(module, fn, argArray);
                };
            },
        });
    }
}
exports.default = ServerInterface;
