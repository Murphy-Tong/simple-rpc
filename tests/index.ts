import express from "express";
import sever from "../src/sever";
const app = express();
app.use("/ar", sever);
app.listen(3003);
console.log(" sever ok");
