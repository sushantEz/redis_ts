import * as net from "net";
import { getter, setter, sleeper } from "../handlers/str";

import { push, pop, lrange, llen, bpop } from "../handlers/list";
import { EListCmdMode, type TSetCmd, type TSleepCmd } from "../interfaces";
import { setExpiry, setPExpiry, getTtl, getPTtl } from "../handlers/common";

const serialize = (d: Buffer) => d.toString("utf-8").trim();

export const onData = (socketConn: net.Socket, d: Buffer) => {
    const data = serialize(d);
    const [first, ...rest] = data.split(" ").filter(Boolean);
    console.log(data, first, rest);

    if (data) {
        switch (first.toLowerCase()) {
            case "echo": socketConn.write(rest.join(" ").concat("\r\n")); break;
            case "ping": socketConn.write("+PONG\r\n"); break;
            case "set": setter(socketConn, rest as TSetCmd); break;
            case "get": getter(socketConn, rest); break;
            case "sleep": sleeper(socketConn, rest as TSleepCmd); break;
            case "expiry": setExpiry(socketConn, rest); break;
            case "pexpiry": setPExpiry(socketConn, rest); break;
            case "ttl": getTtl(socketConn, rest); break;
            case "pttl": getPTtl(socketConn, rest); break;
            case "rpush": push(socketConn, EListCmdMode.RIGHTS, rest); break;
            case "rpop": pop(socketConn, EListCmdMode.RIGHTS, rest); break;
            case "lpush": push(socketConn, EListCmdMode.LEFTS, rest); break;
            case "lpop": pop(socketConn, EListCmdMode.LEFTS, rest); break;
            case "lrange": lrange(socketConn, rest); break;
            case "llen": llen(socketConn, rest); break;
            case "brpop": bpop(socketConn, EListCmdMode.RIGHTS, rest); break;
            case "blpop": bpop(socketConn, EListCmdMode.LEFTS, rest); break;
            case "quit": socketConn.end("socket connection closed!\r\n"); break; // we'll create separate handlers for it later, for now we can just end the connection with a message
            default: socketConn.write("Invalid Command\r\n"); break;
        }
    }

    return;
};
