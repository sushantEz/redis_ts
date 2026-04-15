import * as net from "net";
import { DATA } from "../cache/data";
import { EDataType, ETtlType } from "../interfaces";

export const inc = (conn: net.Socket, [k, ...v]: string[]) => {
    let i = v[0] ? Number(v[0]) : 1;
    if (isNaN(i)) {
        conn.write("ERR value is not an integer or out of range\r\n");
        return;
    }

    let data = DATA.get(k);

    if (!data || DATA.isExpired(data)) {
        data = {
            v: 0,
            at: Date.now(),
            dType: EDataType.NUMBER,
            ttl: "",
            ttlType: ETtlType.NONE,
            version: 0
        };
    } else if (data.dType !== EDataType.NUMBER) {
        conn.write("ERR value is not an integer or out of range\r\n");
        return;
    }

    (data.v as number) += i;
    data.version++;
    DATA.set(k, data);
    conn.write(`(integer)${data.v}`);
    return;
};

export const dec = (conn: net.Socket, [k, ...v]: string[]) => {
    const d = v[0] ? Number(v[0]) : 1;
    if (isNaN(d)) {
        conn.write("ERR value is not an integer or out of range\r\n");
        return;
    }
    let data = DATA.get(k);
    if (!data || DATA.isExpired(data)) {
        data = {
            v: 0,
            at: Date.now(),
            dType: EDataType.NUMBER,
            ttl: "",
            ttlType: ETtlType.NONE,
            version: 0
        };
    } else if (data.dType !== EDataType.NUMBER) {
        conn.write("ERR value is not an integer or out of range\r\n");
        return;
    }

    (data.v as number) -= d;
    data.version++;
    DATA.set(k, data);
    conn.write(`(integer)${data.v}`);
    return;
};
