import * as net from "net";
import { type DoublyLinkedList } from "../services/doublyLinkedList";

export const tokens = ["px", "ex", "nx", "xx", "pxat", "exat", "echo", "set", "get", "nil", "expiry", "pexpiry", "ttl", "pttl", "sleep", "rpush", "rpop", "lpush", "lpop", "lrange", "llen", "blpop", "brpop"];

export const enum EXNMode { NX = "nx", XX = "xx" }
export const enum ETtlType { PX = "px", EX = "ex", NONE = "none", PXAT = "pxat", EXAT = "exat" };
export const enum EDataType { STRING = "string", LIST = "list", SET = "set", HASH = "hash", ZSET = "zset", STREAM = "stream", VECTOR_SET = "vectorset", JSON = "json" };

export type TValMeta = { ttl: string, ttlType: ETtlType, at: number; dType: EDataType; };
export type TValue = TValMeta & { v: string | DoublyLinkedList; };
export type TSetCmd = [string, string, ETtlType & EXNMode, string, EXNMode];
export type TSleepCmd = [string, string, string, ...TSetCmd];

export const enum EListCmdMode { RIGHTS = "r", LEFTS = "l" };

export type TStreamValue = TValMeta & {
    v: Map<string, string[][]>;
    ids: string[];
    lastId: string;
    del: boolean;
};

export type TBoolCallback<v> = (v: v) => boolean;
export type TNumCallback<v> = (v: v) => number;
export type TVoidCallback = () => void;

export type TConnMeta = { conn: net.Socket; timeout: number; at: number; };

export type TConnString = TConnMeta & { type: EDataType.STRING; };
export type TConnList = TConnMeta & {
    type: EDataType.LIST;
    count: number;
};
export type TConnStream = TConnMeta & {
    type: EDataType.STREAM;
    count: number;
    lastId: string;
};
export type TConnZSet = TConnMeta & {
    type: EDataType.ZSET;
    count: number;
};
export type TConnSet = TConnMeta & { type: EDataType.SET; };
export type TConnHash = TConnMeta & { type: EDataType.HASH; };
export type TConnVector = TConnMeta & { type: EDataType.VECTOR_SET; };
export type TConnJson = TConnMeta & { type: EDataType.JSON; };

export type TConnMapData = TConnString | TConnList | TConnStream | TConnZSet | TConnSet | TConnHash | TConnVector | TConnJson;
export type TConnMap = Map<string, TConnMapData[]>;