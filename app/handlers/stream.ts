import * as net from "net";
import { EDataType, ETtlType, tokens } from "../interfaces";
import { STREAMS } from "../cache/data";

export const xadd = (conn: net.Socket, [k, id, ...v]: string[]) => {
    if (!(!!k) || typeof k != "string") { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (!(!!v)) { conn.write("ERROR: Key must be followed by a Value\r\n"); return; }

    if (tokens.includes(k.toLowerCase())) { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (tokens.includes(id.toLowerCase())) { conn.write("ERROR: Value must be a valid String\r\n"); return; }

    if (id == "0-0") { conn.write(" Invalid stream ID\r\n"); return; }

    let stream = STREAMS.get(k);
    if (!stream) stream = { v: [], id: "", ttl: "0", ttlType: ETtlType.NONE, at: Date.now(), dType: EDataType.STREAM };

    if (id.includes("-")) {
        let [t, s] = id.split("-");
        let [t1, s1] = [t, s].map(e => Number(e));
        if (s == "*" && !isNaN(t1)) {
            //  given-not_given

        } else if (!isNaN(t1) && !isNaN(s1)) {
            // given-given
        } else conn.write("");
    } else if (id == "*") {
        // not_given_at_all

    } else { conn.write(""); return; }

};

export const xread = (conn: net.Socket, []: string[]) => {

};

export const xrange = (conn: net.Socket, []: string[]) => {

};

export const xlen = (conn: net.Socket, []: string[]) => {

};

export const xdel = (conn: net.Socket, []: string[]) => {

};

export const xtrim = (conn: net.Socket, []: string[]) => {

};
