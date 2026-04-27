import * as net from "net";
import { config } from "dotenv";
import { onData } from "./controllers";
import { analizePort } from "./utils/portAnalizer";
import { type TAuthenticConn } from "./interfaces";
import { aof } from "./handlers/aof";

config({ path: ".env" });

const defaultPort = process.env.PORT || 6379;
const dynamicPort = process.argv[(process.argv.findIndex(e => e == "--port") + 1)];

let port = 8080;

const server: net.Server = net.createServer((conn: net.Socket) => {

    const clientId = `${conn.remoteAddress}:${conn.remotePort}`;
    const authenticConn = conn as TAuthenticConn;
    console.log(`client ${clientId} connected!`);

    conn.on("data", (d: Buffer) => onData(authenticConn, d));
    conn.on("close", (e: boolean) => console.log("connection closed ?", e));
    conn.on("error", (e: Error) => console.log("error occured", e));

});

(async () => {
    port = await analizePort(dynamicPort, defaultPort);
    server.listen(port, () => {
        console.log("redis server running on port:", port);
        if (!aof.getProperty("isRewriteInProgress")) aof.loadAOF();
    });
})();
