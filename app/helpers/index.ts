import { CONN_CMDS } from "../cache/data";
import { cmdStore } from "../handlers/common";
import type { TAuthenticConn } from "../interfaces";

const cmdToIgnore = ["multi", "exec", "watch", "discard", "quit"];

export const serialize = (d: Buffer) => {
    const cmd = d.toString("utf-8").trim();
    const [first, ...rest] = cmd.split(" ").filter(Boolean);
    return { first, rest, cmd };
};

export const queueCmd = (conn: TAuthenticConn, d: Buffer, f: string, fromExec?: boolean) => {
    let connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    if (!cmdToIgnore.includes(f.toLowerCase()) && CONN_CMDS.has(connAddress) && !fromExec) {
        cmdStore(conn, d);
        return false;
    }
    else return true;
};

export const sendMsgAndDestroy = (conn: TAuthenticConn, msg: string): boolean => {
    conn.write(msg);
    conn.destroy();
    return false;
};