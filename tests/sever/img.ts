import { useContext } from "../../src/sever";

console.log(1);

export default async function (arg: any): Promise<any> {
  console.log(arg, "this is IMg",useContext().request.url);
  return arg.toLowerCase();
}

export  async function img(arg: any): Promise<any> {
  console.log(arg, "this is IMg",useContext().request.url);
  return arg.toLowerCase();
}
