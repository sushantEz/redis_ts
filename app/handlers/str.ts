import * as net from "net";
import { ETtlType, EXNMode, tokens, type TSleepCmd, type TValue } from "../interfaces";
import { isExpired, sleep } from "../services/data";
import { get, set } from "../cache/data";

export const setter = (conn: net.Socket, [k, v, ...rest]: string[]) => {
    if (!(!!k) || typeof k != "string") { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (!(!!v)) { conn.write("ERROR: Key must be followed by a Value\r\n"); return; }

    if (tokens.includes(k.toLowerCase())) { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (tokens.includes(v.toLowerCase())) { conn.write("ERROR: Value must be a valid String\r\n"); return; }

    let ttl: string = "";
    let ttlType: ETtlType = ETtlType.NONE;
    let mode: EXNMode | undefined;

    rest.forEach((e, i) => {
        if (typeof e != "string") return;
        let elm = e.toLowerCase();
        let incIdx = i + 1;
        if (elm == EXNMode.NX || elm == EXNMode.XX) {
            mode = elm;
        }
        else if (elm == ETtlType.EX || elm == ETtlType.PX || elm == ETtlType.EXAT || elm == ETtlType.PXAT) {
            if (isNaN(Number(rest[incIdx]))) {
                conn.write("ERRR: Invalid TTL Value\r\n");
                return;
            }
            ttlType = elm;
            ttl = rest[incIdx];
        }
    });

    console.log({ ttl, ttlType, mode });
    const exists = (!!get(k)?.v);
    if (mode == EXNMode.NX && exists) {
        conn.write("nil\r\n");
        return;
    } else if (mode == EXNMode.XX && !exists) {
        conn.write("nil\r\n");
        return;
    }
    console.log({ v, ttl, ttlType, at: Date.now() });
    set(k, { v, ttl, ttlType, at: Date.now() });
    conn.write("OK\r\n");

    return;
};

export const getter = (conn: net.Socket, [k]: string[]) => {
    let v: TValue | "nil" = get(k) || "nil";
    if (v != "nil" && v.ttlType != ETtlType.NONE) {
        // passive expiry
        v = isExpired(v) ? "nil" : v;
    }
    conn.write(v + "\r\n");
    return;
};

export const sleeper = async (conn: net.Socket, [t, _, first, ...rest]: TSleepCmd) => {
    await sleep(Number(t) * 1000);
    if (first == "get") getter(conn, rest);
    else if (first == "set") setter(conn, rest);
    return;
};
