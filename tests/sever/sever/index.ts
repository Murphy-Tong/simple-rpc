console.log(1);

export async function haha(arg: any): Promise<any> {
  console.log(arg, "this is haha");
  return arg.toLowerCase();
}
