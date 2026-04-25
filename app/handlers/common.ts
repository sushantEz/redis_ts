import { ETtlType, type TAuthenticConn, type TValNum } from "../interfaces";
import { calRemainingTime } from "../services/data";
import { CONN_CMDS, DATA, NET_CONN } from "../cache/data";
import { onData } from "../controllers";

export const setExpiry = (conn: TAuthenticConn, [k, t]: string[]) => {
    const v = DATA.get(k);
    if (!v || !v.v) { conn.write(0 + "\r\n"); return; }
    v.ttl = t;
    v.ttlType = ETtlType.EX;
    DATA.set(k, v);
    conn.write(1 + "\r\n");
    return;
};

export const setPExpiry = (conn: TAuthenticConn, [k, t]: string[]) => {
    const v = DATA.get(k);
    if (!v || !v.v) { conn.write(0 + "\r\n"); return; }
    v.ttl = t;
    v.ttlType = ETtlType.PX;
    DATA.set(k, v);
    conn.write(1 + "\r\n");
    return;
};

export const getTtl = (conn: TAuthenticConn, [k]: string[]) => {
    const v = DATA.get(k);
    if (!v || !Object.keys(v).length) { conn.write(-2 + "\r\n"); return; }
    if (!v?.ttl || v?.ttlType == ETtlType.NONE) { conn.write(-1 + "\r\n"); return; }
    let remainingTime = (calRemainingTime(v) / 1000);
    if (remainingTime <= 0) {
        DATA.del(k);
        conn.write(-2 + "\r\n"); return;
    }
    conn.write(remainingTime.toFixed(2) + "\r\n");
    return;
};

export const getPTtl = (conn: TAuthenticConn, [k]: string[]) => {
    const v = DATA.get(k);
    if (!v || !Object.keys(v).length) { conn.write(-2 + "\r\n"); return; }
    if (!v?.ttl || v?.ttlType == ETtlType.NONE) { conn.write(-1 + "\r\n"); return; }
    const remainingTime = calRemainingTime(v);
    if (remainingTime <= 0) {
        DATA.del(k);
        conn.write(-2 + "\r\n"); return;
    }
    conn.write(remainingTime + "\r\n");
    return;
};

export const getType = (conn: TAuthenticConn, [k]: string[]) => {
    const v = DATA.get(k);
    if (!v || !Object.keys(v).length) { conn.write("+none\r\n"); return; }
    if (v.ttl && v.ttlType != ETtlType.NONE && calRemainingTime(v) <= 0) {
        DATA.del(k);
        conn.write("+none\r\n"); return;
    }
    conn.write(v.dType + "\r\n");
    return;
};

export const watch = (conn: TAuthenticConn, wks: string[]) => {
    const connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    let cmdStoreData = CONN_CMDS.get(connAddress) || null;
    if (!cmdStoreData) cmdStoreData = { conn, cmds: [], wks: [] };
    for (const wk of wks) {
        const v = (DATA.get(wk) as TValNum)?.version || -1;
        cmdStoreData.wks.push({ [wk]: v });
    }
    CONN_CMDS.set(connAddress, cmdStoreData);
    conn.write("OK\r\n");
    return;
};

export const unwatch = (conn: TAuthenticConn) => {
    const connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    let cmdStoreData = CONN_CMDS.get(connAddress);
    if (cmdStoreData && cmdStoreData.wks.length) {
        cmdStoreData.wks.length = 0;
        CONN_CMDS.set(connAddress, cmdStoreData);
    }
    conn.write("OK!\r\n");
    return;
};

export const multi = (conn: TAuthenticConn) => {
    const connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    let cmdStoreData = CONN_CMDS.get(connAddress) || null;
    if (!cmdStoreData) cmdStoreData = { conn, cmds: [], wks: [] };
    CONN_CMDS.set(connAddress, cmdStoreData);
    conn.write("OK\r\n");
    return;
};

export const cmdStore = (conn: TAuthenticConn, cmd: Buffer) => {
    let connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    const cmdStoreData = CONN_CMDS.get(connAddress);
    if (!(cmdStoreData?.conn && cmdStoreData.conn.readyState !== "open")) {
        conn.write("\r\n");
        return;
    }
    cmdStoreData.cmds.push(cmd);
    CONN_CMDS.set(connAddress, cmdStoreData);
    conn.write("QUEUED\r\n");
    return;
};

export const exec = (conn: TAuthenticConn) => {
    let connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    const cmdStoreData = CONN_CMDS.get(connAddress);
    if (!(cmdStoreData?.conn && cmdStoreData.conn.readyState !== "open")) {
        conn.write("\r\n");
        return;
    }
    let txnDiscarded = false;
    cmdStoreData.wks.forEach(wk => {
        if (txnDiscarded) return;
        const k = Object.keys(wk)[0];
        const v = (DATA.get(k) as TValNum)?.version || 0;
        if (v != wk[k]) {
            conn.write("Transaction discarded because of watched key " + k + "\r\n");
            CONN_CMDS.delete(connAddress);
            txnDiscarded = true;
            return;
        }
    });
    if (txnDiscarded) return;
    for (const [_, cmd] of cmdStoreData.cmds.entries()) {
        onData(conn, cmd, true);
    }
    CONN_CMDS.delete(connAddress);
    conn.write("exec done!\r\n");
    return;
};

export const discard = (conn: TAuthenticConn) => {
    const connAddress = `${conn.remoteAddress}:${conn.remotePort}`;
    CONN_CMDS.delete(connAddress);
    conn.write("OK!\r\n");
    return;
};

export const info = (conn: TAuthenticConn) => {
    const mem = process.memoryUsage();
    const infoObj = {
        redis_version: "0.0.0.1",
        connected_clients: NET_CONN.keys().toArray().length,
        used_memory: ((mem.heapUsed + mem.external) / 1024 / 1024).toFixed(2) + ' MB',
        role: "Master"
    };
    conn.write(JSON.stringify(infoObj));
    return;
};