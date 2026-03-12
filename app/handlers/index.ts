import * as net from "net";
import { ETtlType, EXNMode, tokens, type TSleepCmd } from "../interfaces";
import { isExpired, sleep } from "../services";
import { get, set } from "../cache";

export const setter = (con: net.Socket, [k, v, ...rest]: string[]) => {
    if (!(!!k) || typeof k != "string") { con.write("ERROR: Key must be a valid String\r\n"); return; }
    if (!(!!v)) { con.write("ERROR: Key must be followed by a Value\r\n"); return; }

    if (tokens.includes(k.toLowerCase())) { con.write("ERROR: Key must be a valid String\r\n"); return; }
    if (tokens.includes(v.toLowerCase())) { con.write("ERROR: Value must be a valid String\r\n"); return; }

    let ttl: string = "";
    let type: ETtlType = ETtlType.NONE;
    let mode: EXNMode | undefined;

    rest.forEach((e, i) => {
        if (typeof e != "string") return;
        let elm = e.toLowerCase();
        let incIdx = i + 1;
        if (elm == EXNMode.NX || elm == EXNMode.XX) {
            mode = elm as EXNMode;
        }
        else if (elm == ETtlType.EX || elm == ETtlType.PX) {
            if (isNaN(Number(rest[incIdx]))) {
                con.write("ERRR: Invalid TTL Value\r\n");
                return;
            }
            type = elm;
            ttl = rest[incIdx];
        }
    });

    console.log({ ttl, type, mode });
    const exists = (!!get(k)?.v);
    if (mode == EXNMode.NX && exists) {
        con.write("nil\r\n");
        return;
    } else if (mode == EXNMode.XX && !exists) {
        con.write("nil\r\n");
        return;
    }

    set(k, { v, ttl, type, at: Date.now() });
    con.write("OK\r\n");

    return;
};

export const getter = (con: net.Socket, k: string) => {
    let v = get(k) || 'nil';
    if (v != "nil" && !!v.ttl) {
        // passive expiry
        v = isExpired(v) ? "nil" : v;
    }
    con.write(v + "\r\n");
    return;
};

export const sleeper = async (con: net.Socket, [time, _, first, ...rest]: TSleepCmd) => {
    await sleep(Number(time) * 1000);
    if (first == "get") getter(con, rest[0]);
    else if (first == "set") setter(con, rest);

};