import * as net from "net";
import { getter, setter, sleeper } from "../handlers/str";

import { push, pop, lrange, llen, bpop } from "../handlers/list";
import { EListCmdMode, type TSetCmd, type TSleepCmd } from "../interfaces";
import { setExpiry, setPExpiry, getTtl, getPTtl, getType, multi, exec, info, watch } from "../handlers/common";
import { xadd, xdel, xlen, xrange, xread, xtrim } from "../handlers/stream";
import { dec, inc } from "../handlers/txns";
import { serializeAndChecker } from "../helpers";

export const onData = (conn: net.Socket, d: Buffer, fromExec?: boolean) => {

    const { data, first, rest } = serializeAndChecker(d, conn, fromExec);

    if (data) {
        switch (first.toLowerCase()) {
            case "echo": conn.write(rest.join(" ").concat("\r\n")); break;
            case "ping": conn.write("+PONG\r\n"); break;
            case "set": { console.log("set called"); setter(conn, rest as TSetCmd); } break;
            case "get": { console.log("get called"); getter(conn, rest); } break;
            case "sleep": sleeper(conn, rest as TSleepCmd); break;
            case "expiry": setExpiry(conn, rest); break;
            case "pexpiry": setPExpiry(conn, rest); break;
            case "ttl": getTtl(conn, rest); break;
            case "pttl": getPTtl(conn, rest); break;
            case "rpush": push(conn, EListCmdMode.RIGHTS, rest); break;
            case "rpop": pop(conn, EListCmdMode.RIGHTS, rest); break;
            case "lpush": push(conn, EListCmdMode.LEFTS, rest); break;
            case "lpop": pop(conn, EListCmdMode.LEFTS, rest); break;
            case "lrange": lrange(conn, rest); break;
            case "llen": llen(conn, rest); break;
            case "brpop": bpop(conn, EListCmdMode.RIGHTS, rest); break;
            case "blpop": bpop(conn, EListCmdMode.LEFTS, rest); break;
            case "type": getType(conn, rest); break;
            case "xadd": xadd(conn, rest); break;
            case "xrange": xrange(conn, rest); break;
            case "xread": xread(conn, rest); break;
            case "xlen": xlen(conn, rest); break;
            case "xdel": xdel(conn, rest); break;
            case "xtrim": xtrim(conn, rest); break;
            case "inc": inc(conn, rest); break;
            case "incby": inc(conn, rest); break;
            case "dec": dec(conn, rest); break;
            case "decby": dec(conn, rest); break;
            case "multi": multi(conn); break;
            case "exec": exec(conn); break;
            case "watch": watch(conn, rest); break;
            case "info": info(conn); break;
            case "quit": conn.end("socket connection closed!\r\n"); break; // we'll create separate handlers for it later, for now we can just end the connection with a message
            default: conn.write("Invalid Command\r\n"); break;
        }
    }

    return;
};
