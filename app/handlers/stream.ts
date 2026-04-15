import * as net from "net";
import { EDataType, ETtlType, tokens, type TStreamValue } from "../interfaces";
import { NET_CONN, STREAMS } from "../cache/data";

const compareIds = (a: string, b: string): number => {
    const [ams, aseq] = a.split("-").map(Number);
    const [bms, bseq] = b.split("-").map(Number);
    if (ams !== bms) return ams - bms;
    return aseq - bseq;
};

const streamRange = (stream: TStreamValue, startId: string, endId: string, count: number) => {
    const result = [];
    for (const id of stream.ids) {
        if (compareIds(id, startId) <= 0) continue;
        if (endId !== "+" && compareIds(id, endId) > 0) break;
        result.push({ id, fields: stream.v.get(id) });
        if (result.length >= count) break;
    }
    return result;
};

export const xadd = (conn: net.Socket, d: string[]) => {
    if (d.find(e => tokens.includes(e))) {
        conn.write("ERROR: Invalid Command\r\n"); return;
    }
    let [k, id, ...v] = d;
    if (!k || typeof k !== "string") {
        conn.write("ERROR: Key must be a valid String\r\n"); return;
    }

    if (!v.length || v.length % 2 !== 0) {
        conn.write("ERROR: Invalid field-value pairs\r\n"); return;
    }

    if (id === "0-0") {
        conn.write("ERR The ID specified in XADD must be greater than 0-0\r\n"); return;
    }

    let at = Date.now();
    let stream = STREAMS.get(k);

    if (!stream || !Object.keys(stream).length || STREAMS.isExpired(stream)) {
        stream = {
            v: new Map<string, string[][]>(),
            ids: [],
            lastId: "",
            ttl: "0",
            ttlType: ETtlType.NONE,
            at,
            dType: EDataType.STREAM,
            del: false,
            version: 0
        };
    }

    if (id === "*") {
        if (!stream.lastId) id = `${at}-0`;
        else {
            const [lastMs, lastSeq] = stream.lastId.split("-").map(Number);

            if (at === lastMs) id = `${at}-${lastSeq + 1}`;
            else if (at > lastMs) id = `${at}-0`;
            else id = `${lastMs}-${lastSeq + 1}`;
        }
    } else if (id.includes("-")) {
        const [t, c] = id.split("-");
        const t1 = Number(t);
        const c1 = c === "*" ? undefined : Number(c);

        if (isNaN(t1)) {
            conn.write("ERR invalid ID\r\n"); return;
        }

        if (stream.lastId) {
            const [lastMs, lastSeq] = stream.lastId.split("-").map(Number);
            if (t1 < lastMs || (t1 === lastMs && (c1 ?? 0) <= lastSeq)) {
                conn.write("ERR ID must be greater than last ID\r\n");
                return;
            }
        }

        if (c === "*") id = `${t1}-0`;
        else id = `${t1}-${c1}`;
    } else {
        conn.write("ERR invalid ID\r\n"); return;
    }

    let fields: string[][] = [];
    for (let i = 0; i < v.length; i += 2) {
        fields.push([v[i], v[i + 1]]);
    }

    if (stream.v.has(id)) {
        conn.write("ERR ID already exists\r\n"); return;
    }

    stream.v.set(id, fields);
    stream.ids.push(id);
    stream.lastId = id;
    stream.version++;
    STREAMS.set(k, stream);

    const netConns = NET_CONN.get(k);
    if (netConns?.length) {
        const remaining = [];
        for (const net of netConns) {
            if (net.type != EDataType.STREAM) continue;
            if (compareIds(id, net.lastId) > 0) {
                let writable = streamRange(stream, net.lastId, id, net.count);
                net.conn.resume();
                net.conn.write(JSON.stringify(writable) + "\r\n");
            } else remaining.push(net);
        }
        if (remaining.length) NET_CONN.setArr(k, remaining);
        else NET_CONN.del(k);
    }

    conn.write(`${id}\r\n`);
    return;
};

export const xread = (conn: net.Socket, d: string[]) => {
    if (d.find(e => tokens.includes(e)) || d.length < 3) {
        conn.write("ERROR: Invalid Command 1\r\n"); return;
    }

    let xr: Record<"count" | "block" | "streams", any> = {
        count: undefined,
        block: undefined,
        streams: undefined
    };
    for (const [i, e] of d.entries()) {
        if (e.toLowerCase() == "count") xr["count"] = d[i + 1];
        else if (e.toLowerCase() == "block") xr["block"] = d[i + 1];
        else if (e.toLowerCase() == "streams") {
            xr["streams"] = d.slice(i + 1);
            break;
        }
    }

    let l = xr["streams"];
    if (l == undefined) {
        conn.write("ERROR: Key Id pairs not provided\r\n"); return;
    }
    if (!Array.isArray(l) || !l.length || l.length % 2 != 0) {
        conn.write("ERROR: Every key must have an id\r\n"); return;
    }

    let keyIdPairs = [];
    for (let i = 0; i < l.length / 2; i++) {
        const key = l[i];
        const id = l[(l.length / 2) + i];
        if (!id.includes("-")) {
            conn.write("ERROR: Key Id pairs must be valid\r\n");
            return;
        }
        keyIdPairs.push([key, id]);
    }
    xr["streams"] = keyIdPairs;
    console.log(xr);

    const result = [];
    let block = true;
    for (let [k, id] of xr.streams) {
        const stream = STREAMS.get(k);
        if (!stream || stream.del || STREAMS.isExpired(stream)) continue;

        if (id === "$") id = stream.lastId || "0-0";

        let entries = [];
        let count = xr.count ? Number(xr.count) : Infinity;

        for (const entryId of stream.ids) {
            if (compareIds(entryId, id) > 0) {
                entries.push([entryId, stream.v.get(entryId)]);
                count--;
                if (count <= 0) break;
            }
        }

        if (entries.length) {
            result.push([k, entries]);
        }
    }

    if (xr["block"] && block) {
        for (const [k, id] of keyIdPairs) {
            NET_CONN.set(k, {
                conn,
                timeout: Number(xr.block) || 0,
                at: Date.now(),
                type: EDataType.STREAM,
                count: xr.count || Infinity,
                lastId: id
            });
        }
        conn.pause();
    } else conn.write(JSON.stringify(result) + "\r\n");

    return;
};

export const xrange = (conn: net.Socket, []: string[]) => {

};

export const xlen = (conn: net.Socket, [k]: string[]) => {
    const stream = STREAMS.get(k);
    if (!stream || STREAMS.isExpired(stream) || !stream.ids.length || stream.del) { conn.write("nil\r\n"); return; }
    conn.write("integer" + stream.ids.length + "\r\n");
    return;
};

export const xdel = (conn: net.Socket, [k, ...ids]: string[]) => {
    if (!k || !ids.length) { conn.write("ERR: Invalid XDEL Command\r\n"); return; }
    const stream = STREAMS.get(k);
    if (!stream || STREAMS.isExpired(stream) || !stream.ids.length || stream.del) { conn.write("nil\r\n"); return; }
    let delCount = 0;
    let rids = ids.filter(id => {
        if (stream.v.delete(id)) {
            delCount++;
            return false;
        }
        else return true;
    });
    stream.ids = rids;
    stream.lastId = rids[rids.length - 1] || "";
    stream.version++;
    STREAMS.set(k, stream);
    conn.write("integer" + delCount + "\r\n");
    return;
};

export const xtrim = (conn: net.Socket, [key, strategy, ...args]: string[]) => {
    if (!key || !strategy) {
        conn.write("ERR wrong number of arguments for XTRIM\r\n");
        return;
    }

    strategy = strategy.toLowerCase();
    if (!["maxlen", "minid"].includes(strategy)) {
        conn.write("ERR syntax error\r\n");
        return;
    }

    let value: string;
    if (args[0] === "~") value = args[1];
    else value = args[0];

    if (!value) {
        conn.write("ERR syntax error\r\n");
        return;
    }

    const stream = STREAMS.get(key);
    if (!stream || STREAMS.isExpired(stream)) {
        conn.write("(nil)\r\n");
        return;
    }

    let removed = 0;

    if (strategy === "maxlen") {
        const max = Number(value);
        if (isNaN(max) || max < 0) {
            conn.write("ERR value is not an integer or out of range\r\n");
            return;
        }
        if (stream.ids.length > max) {
            const toDelete = stream.ids.length - max;
            const removedIds = stream.ids.splice(0, toDelete);
            for (const id of removedIds) {
                if (stream.v.delete(id)) removed++;
            }
        }
    }
    else if (strategy === "minid") {
        while (
            stream.ids.length &&
            compareIds(stream.ids[0], value) < 0
        ) {
            const id = stream.ids.shift();
            if (id && stream.v.delete(id)) removed++;
        }
    }

    stream.lastId = stream.ids.length
        ? stream.ids[stream.ids.length - 1]
        : "0-0";
    stream.version++;
    STREAMS.set(key, stream);

    conn.write(`${removed}\r\n`);
};