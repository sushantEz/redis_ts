import type { Socket } from "net";
import { DataStore, StreamStore } from "../common/dataStore";
import { NetConnStore } from "../common/netSocketStore";
import type { TConnMapData, TStreamValue, TValue } from "../interfaces";
import { isExpired, calRemainingTime } from "../services/data";

export const DATA: DataStore<string, TValue> = new DataStore(100, isExpired, calRemainingTime);
export const STREAMS: StreamStore<string, TStreamValue> = new StreamStore(100, isExpired, calRemainingTime);
export const NET_CONN: NetConnStore<string, TConnMapData[]> = new NetConnStore(100);
export const CONN_CMDS: Map<string, {
    conn: Socket,
    cmds: Buffer[],
    wks: { [k: string]: string | number; }[],
    unwks: { [k: string]: string | number; }[],
}> = new Map();