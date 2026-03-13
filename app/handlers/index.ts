import * as net from "net";
import { ETtlType, EXNMode, tokens, type TSleepCmd } from "../interfaces";
import { calRemainingTime, isExpired, sleep } from "../services";
import { del, get, set } from "../cache";

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
            mode = elm;
        }
        else if (elm == ETtlType.EX || elm == ETtlType.PX || elm == ETtlType.EXAT || elm == ETtlType.PXAT) {
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
    console.log({ v, ttl, type, at: Date.now() });
    set(k, { v, ttl, type, at: Date.now() });
    con.write("OK\r\n");

    return;
};

export const getter = (con: net.Socket, [k]: string[]) => {
    let v = get(k) || 'nil';
    if (v != "nil" && !!v.ttl) {
        // passive expiry
        v = isExpired(v) ? "nil" : v;
    }
    con.write(v + "\r\n");
    return;
};

export const sleeper = async (con: net.Socket, [t, _, first, ...rest]: TSleepCmd) => {
    await sleep(Number(t) * 1000);
    if (first == "get") getter(con, rest);
    else if (first == "set") setter(con, rest);
    return;
};

export const setExpiry = (con: net.Socket, [k, t]: string[]) => {
    const v = get(k);
    if (!v || !v.v) { con.write(0 + "\r\n"); return; }
    v.ttl = t;
    v.type = ETtlType.EX;
    set(k, v);
    con.write(1 + "\r\n");
    return;
};

export const setPExpiry = (con: net.Socket, [k, t]: string[]) => {
    const v = get(k);
    if (!v || !v.v) { con.write(0 + "\r\n"); return; }
    v.ttl = t;
    v.type = ETtlType.PX;
    set(k, v);
    con.write(1 + "\r\n");
    return;
};

export const getTtl = (con: net.Socket, [k]: string[]) => {
    const v = get(k);
    console.log({ v });
    if (!v || !Object.keys(v).length) { con.write(-2 + "\r\n"); return; }
    if (!v?.ttl || v?.type == ETtlType.NONE) { con.write(-1 + "\r\n"); return; }
    let remainingTime = (calRemainingTime(v) / 1000);
    if (remainingTime <= 0) {
        del(k);
        con.write(-2 + "\r\n"); return;
    }
    con.write(remainingTime.toFixed(2) + "\r\n");
    return;
};

export const getPTtl = (con: net.Socket, [k]: string[]) => {
    const v = get(k);
    if (!v || !Object.keys(v).length) { con.write(-2 + "\r\n"); return; }
    if (!v?.ttl || v?.type == ETtlType.NONE) { con.write(-1 + "\r\n"); return; }
    const remainingTime = calRemainingTime(v);
    if (remainingTime <= 0) {
        del(k);
        con.write(-2 + "\r\n"); return;
    }
    con.write(remainingTime + "\r\n");
    return;
};
