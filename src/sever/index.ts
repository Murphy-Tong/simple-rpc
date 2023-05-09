console.log(1);

export async function haha(...args: any): Promise<any> {
  console.log(args, "this is haha");
  return 111;
}
