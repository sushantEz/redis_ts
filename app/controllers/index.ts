import * as net from "net";
import {
    getter, setter,
    sleeper
} from "../handlers";
import type { TSetCmd, TSleepCmd } from "../interfaces";

const serialize = (d: Buffer) => d.toString("utf-8").trim();

export const onData = (socketConn: net.Socket, d: Buffer) => {
    const data = serialize(d);
    const [first, ...rest] = data.split(" ").filter(Boolean);
    console.log(data, first, rest);

    if (data) {
        switch (first.toLowerCase()) {
            case "echo": socketConn.write(rest.join(" ").concat("\r\n")); break;
            case "set": setter(socketConn, rest as TSetCmd); break;
            case "get": getter(socketConn, rest[0]); break;
            case "sleep": sleeper(socketConn, rest as TSleepCmd); break;
            default: socketConn.write("+PONG\r\n"); break;
        }
    }

    return;
};
