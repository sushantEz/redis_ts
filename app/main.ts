import * as net from "net";
import { config } from "dotenv";
import { expiryLoop } from "./cache";
import { onData } from "./controllers";

config({ path: ".env" });

const port = process.env.PORT || 6379;

console.log("Logs from your program will appear here!");

const server: net.Server = net.createServer((socketConn: net.Socket) => {

    socketConn.on("data", (d: Buffer) => onData(socketConn, d));
    socketConn.on("close", (e: boolean) => console.log("connection closed ?", e));
    socketConn.on("error", (e: Error) => console.log("error occured", e));

});

server.listen(port);

setInterval(() => {
    expiryLoop();
}, 100);

// const serialize = (data: string) => {
//     // let data = d.toString("utf-8");
//     // console.log(data);
//     let arr: string[] = [];
//     let str = "";
//     data.split("\r\n").forEach((e, index, array) => {
//         const line = e + "\r\n";
//         if (/[*]/.test(e) || (/[$-]/.test(e) && str !== "")) {
//             arr.push(str);
//             str = line;
//         } else {
//             str += line;
//         }
//         if (index === array.length - 2) {
//             arr.push(str);
//         }
//     });
//     arr = arr.filter(Boolean);
//     console.log(arr);
//     let type = "";
//     if (data.startsWith("+")) type = "string";
//     if (data.startsWith("-")) type = "error";
//     if (data.startsWith(":")) type = "integer";
//     if (data.startsWith("$")) type = "bulk_string";
//     if (data.startsWith("*")) type = "string";
// };
// serialize("*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\nbar\r\n");