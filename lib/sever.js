"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useContext = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getSrcDir() {
    var _a;
    const srcDir = (_a = require.main) === null || _a === void 0 ? void 0 : _a.path;
    if (!srcDir) {
        throw new Error("无法找到项目目录");
    }
    return path_1.default.resolve(srcDir, "sever");
}
const srcDir = getSrcDir();
function findModuleByPath(dir, ...paths) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = paths.shift();
        if (!name) {
            return;
        }
        const isLastSegment = paths.length === 0;
        const files = yield fs_1.default.promises.readdir(dir, { withFileTypes: true });
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const fname = path_1.default.parse(f.name).name;
            if (fname === name) {
                if (isLastSegment) {
                    if (f.isFile()) {
                        return Promise.resolve().then(() => __importStar(require(path_1.default.join(dir, f.name))));
                    }
                    return;
                }
                else {
                    if (f.isDirectory()) {
                        return findModuleByPath(path_1.default.join(dir, f.name), ...paths);
                    }
                    else {
                        return;
                    }
                }
            }
        }
    });
}
function findModule(...paths) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!(yield fs_1.default.promises.stat(srcDir)).isDirectory()) {
                throw new Error(`${srcDir} 应该是文件夹`);
            }
        }
        catch (e) {
            if (e.code === "ENOENT") {
                return;
            }
            throw e;
        }
        const mPath = [...paths];
        let m = yield findModuleByPath(srcDir, ...mPath);
        if (!m) {
            return findModuleByPath(srcDir, ...mPath, "index");
        }
        return m;
    });
}
let ctx;
function useContext() {
    return ctx;
}
exports.useContext = useContext;
function setContext(c) {
    ctx = c;
}
function invokeModule(moduleName, fnName, { args, request, response }) {
    return __awaiter(this, void 0, void 0, function* () {
        let module;
        if (!moduleName) {
            module = yield findModule("index");
            if (!module) {
                throw new Error(`找不到模块`);
            }
        }
        if (!module) {
            module = yield findModule(moduleName);
        }
        if (!module) {
            throw new Error(`找不到模块: ${moduleName}`);
        }
        if (fnName && typeof module[fnName] !== "function") {
            throw new Error(`${moduleName} 模块中不存在 方法 ${fnName}`);
        }
        if (!fnName) {
            const mf = module.default || module;
            if (!mf || typeof mf !== "function") {
                throw new Error(`${moduleName} 模块的默认导出不是方法`);
            }
        }
        const fn = fnName ? module[fnName] : module.default || module;
        setContext({ request, response });
        let res = undefined;
        try {
            res = fn(...args);
        }
        catch (e) {
            throw e;
        }
        finally {
            setContext(undefined);
        }
        if (res instanceof Promise) {
            res = yield res;
        }
        return res;
    });
}
function default_1(request, response, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (request.method.toLowerCase() !== "post") {
            return next();
        }
        const buffers = [];
        request.on("data", (buf) => {
            buffers.push(buf);
        });
        request.on("end", () => __awaiter(this, void 0, void 0, function* () {
            request.body = Buffer.concat(buffers);
            if (!buffers.length) {
                next();
            }
            try {
                const jsonData = JSON.parse(request.body.toString());
                if (!jsonData || typeof jsonData !== "object") {
                    return next();
                }
                const { fn, args, module } = jsonData;
                const res = yield invokeModule(module, fn, { args, request, response });
                if (res) {
                    response.send(res);
                }
                response.end();
            }
            catch (e) {
                return next(e);
            }
        }));
    });
}
exports.default = default_1;
