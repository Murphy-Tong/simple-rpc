import { NextFunction, Response, Request } from "express";
export declare type IContext = {
    request: Request;
    response: Response;
};
export declare function useContext(): IContext;
export default function (request: Request, response: Response, next: NextFunction): Promise<void>;
