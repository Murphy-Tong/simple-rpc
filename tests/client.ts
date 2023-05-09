import ServerInterface from "../src/client";
import * as sever from "./sever/index";
const api = new ServerInterface({ host: "http://localhost:3003/ar" }).create<
  typeof sever
>();

(async () => {
  api.haha("IJJ").then((r) => {
    console.log(typeof r, r);
  });
  api.img("IMGGG").then((r) => {
    console.log(typeof r, r);
  });
})();
