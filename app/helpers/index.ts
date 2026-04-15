import * as net from "net";
import { CONN_CMDS } from "../cache/data";
import { cmdStore } from "../handlers/common";

const cmdToIgnore = ["multi", "exec", "watch", "discard", "quit"];

export const serializeAndChecker = (d: Buffer, conn: net.Socket, fromExec?: boolean) => {
    const data = d.toString("utf-8").trim();
    const [first, ...rest] = data.split(" ").filter(Boolean);
    let connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    if (!cmdToIgnore.includes(first.toLowerCase()) && CONN_CMDS.has(connAddress) && !fromExec) { cmdStore(conn, d); return {}; }
    return { data, first, rest };
};