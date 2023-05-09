import { NextFunction, Response, Request } from "express";
import fs from "fs";
import path from "path";

function getSrcDir() {
  const srcDir = require.main?.path;
  if (!srcDir) {
    throw new Error("无法找到项目目录");
  }
  return path.resolve(srcDir, "sever");
}

const srcDir = getSrcDir();

async function findModuleByPath(dir: string, ...paths: string[]): Promise<any> {
  const name = paths.shift();
  if (!name) {
    return;
  }
  const isLastSegment = paths.length === 0;
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fname = path.parse(f.name).name;
    if (fname === name) {
      if (isLastSegment) {
        if (f.isFile()) {
          return import(path.join(dir, f.name));
        }
        return;
      } else {
        if (f.isDirectory()) {
          return findModuleByPath(path.join(dir, f.name), ...paths);
        } else {
          return;
        }
      }
    }
  }
}

async function findModule(...paths: string[]) {
  try {
    if (!(await fs.promises.stat(srcDir)).isDirectory()) {
      throw new Error(`${srcDir} 应该是文件夹`);
    }
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return;
    }
    throw e;
  }
  const mPath = [...paths];
  let m = await findModuleByPath(srcDir, ...mPath);
  if (!m) {
    return findModuleByPath(srcDir, ...mPath, "index");
  }
  return m;
}

export type IContext = {
  request: Request;
  response: Response;
};

let ctx: IContext | undefined;
export function useContext(): IContext {
  return ctx!;
}

function setContext(c?: IContext) {
  ctx = c;
}

async function invokeModule(
  moduleName: string | undefined,
  fnName: string | undefined,
  { args, request, response }: any
) {
  let module;
  if (!moduleName) {
    module = await findModule("index");
    if (!module) {
      throw new Error(`找不到模块`);
    }
  }
  if (!module) {
    module = await findModule(moduleName!);
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
  let res: any = undefined;
  try {
    res = fn(...args);
  } catch (e) {
    throw e;
  } finally {
    setContext(undefined);
  }
  if (res instanceof Promise) {
    res = await res;
  }
  return res;
}

export default async function (
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (request.method.toLowerCase() !== "post") {
    return next();
  }
  const buffers: Buffer[] = [];
  request.on("data", (buf) => {
    buffers.push(buf);
  });
  request.on("end", async () => {
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
      const res = await invokeModule(module, fn, { args, request, response });
      if (res) {
        response.send(res);
      }
      response.end();
    } catch (e) {
      return next(e);
    }
  });
}
