import * as net from "net";
import { type DoublyLinkedList } from "../services/doublyLinkedList";

export const tokens = ["px", "ex", "nx", "xx", "pxat", "exat", "echo", "set", "get", "nil", "expiry", "pexpiry", "ttl", "pttl", "sleep", "rpush", "rpop", "lpush", "lpop", "lrange", "llen", "blpop", "brpop"];

export const enum EXNMode { NX = "nx", XX = "xx" }
export const enum ETtlType { PX = "px", EX = "ex", NONE = "none", PXAT = "pxat", EXAT = "exat" };
export const enum EDataType { STRING = "string", LIST = "list", SET = "set", HASH = "hash", ZSET = "zset", STREAM = "stream", VECTOR_SET = "vectorset", JSON = "json" };

export type TValMeta = { ttl: string, ttlType: ETtlType, at: number; dType: EDataType; };
export type TValue = { v: string | DoublyLinkedList; } & TValMeta;
export type TSetCmd = [string, string, ETtlType & EXNMode, string, EXNMode];
export type TSleepCmd = [string, string, string, ...TSetCmd];

export const enum EListCmdMode { RIGHTS = "r", LEFTS = "l" };
export type TConnMapData = { conn: net.Socket; timeout: number; at: number; };
export type TConnMap = Map<string, TConnMapData[]>;

export type TStreamValue = { id: string; v: string[]; } & TValMeta;

export type TBoolCallback<v> = (v: v) => boolean;
export type TNumCallback<v> = (v: v) => number;
export type TVoidCallback = () => void;