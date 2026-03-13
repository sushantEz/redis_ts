export const tokens = ["px", "ex", "nx", "xx", "pxat", "exat", "echo", "set", "get", "nil"];

export const enum EXNMode { NX = "nx", XX = "xx" }
export const enum ETtlType { PX = "px", EX = "ex", NONE = "none", PXAT = "pxat", EXAT = "exat" };
export type TValue = { v: string, ttl: string, type: ETtlType, at: number; };
export type TSetCmd = [string, string, ETtlType & EXNMode, string, EXNMode];
export type TSleepCmd = [string, string, string, ...TSetCmd];