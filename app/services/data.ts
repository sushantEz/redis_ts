import { ETtlType, type TBoolCallback, type TNumCallback, type TValMeta, type TValue } from "../interfaces";

// active expiry
export const isExpired: TBoolCallback<TValMeta> = (v): boolean => {
    let expired = false;
    if (v.ttlType.toLowerCase() == ETtlType.NONE) { return expired; }
    else if (v.ttlType.toLowerCase() == ETtlType.EX) {
        if (Date.now() > (v.at + (Number(v.ttl) * 1000))) {
            expired = true;
            console.log("deleted", v.ttl, v.ttlType);
        }
    } else if (v.ttlType.toLowerCase() == ETtlType.PX) {
        if (Date.now() > v.at + Number(v.ttl)) {
            expired = true;
            console.log("deleted", v.ttl, v.ttlType);
        }
    } else if (v.ttlType.toLowerCase() == ETtlType.EXAT) {
        if (Date.now() > Number(v.ttl) * 1000) {
            expired = true;
            console.log("deleted", v.ttl, v.ttlType);
        }
    }
    else if (v.ttlType.toLowerCase() == ETtlType.PXAT) {
        if (Date.now() > Number(v.ttl)) {
            expired = true;
            console.log("deleted", v.ttl, v.ttlType);
        }
    }
    return expired;
};

export const calRemainingTime: TNumCallback<TValMeta> = (v): number => {
    let remainingTime = 0;

    if (v.ttlType == ETtlType.NONE) remainingTime = -2;
    else if (v.ttlType == ETtlType.EX) remainingTime = (v.at + Number(v.ttl) * 1000) - Date.now();
    else if (v.ttlType == ETtlType.PX) remainingTime = (v.at + Number(v.ttl)) - Date.now();
    else if (v.ttlType == ETtlType.EXAT) remainingTime = (Number(v.ttl) * 1000) - Date.now();
    else if (v.ttlType == ETtlType.PXAT) remainingTime = (Number(v.ttl)) - Date.now();

    if (remainingTime < 0) remainingTime = -2;

    return remainingTime;
};

export const sleep = async (delayMs: number) => await new Promise((res, rej) => setTimeout(res, delayMs));