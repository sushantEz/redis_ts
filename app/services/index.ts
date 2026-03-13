import { ETtlType, type TValue } from "../interfaces";

// active expiry
export const isExpired = (v: TValue): boolean => {
    let expired = false;
    if (v.type.toLowerCase() == ETtlType.NONE) { return expired; }
    else if (v.type.toLowerCase() == ETtlType.EX) {
        if (Date.now() > (v.at + (Number(v.ttl) * 1000))) {
            expired = true;
            console.log("deleted", v.ttl, v.type);
        }
    } else if (v.type.toLowerCase() == ETtlType.PX) {
        if (Date.now() > v.at + Number(v.ttl)) {
            expired = true;
            console.log("deleted", v.ttl, v.type);
        }
    } else if (v.type.toLowerCase() == ETtlType.EXAT) {
        if (Date.now() > Number(v.ttl) * 1000) {
            expired = true;
            console.log("deleted", v.ttl, v.type);
        }
    }
    else if (v.type.toLowerCase() == ETtlType.PXAT) {
        if (Date.now() > Number(v.ttl)) {
            expired = true;
            console.log("deleted", v.ttl, v.type);
        }
    }
    return expired;
};

export const calRemainingTime = (v: TValue): number => {
    let remainingTime = 0;

    if (v.type == ETtlType.NONE) remainingTime = -2;
    else if (v.type == ETtlType.EX) remainingTime = (v.at + Number(v.ttl) * 1000) - Date.now();
    else if (v.type == ETtlType.PX) remainingTime = (v.at + Number(v.ttl)) - Date.now();
    else if (v.type == ETtlType.EXAT) remainingTime = (Number(v.ttl) * 1000) - Date.now();
    else if (v.type == ETtlType.PXAT) remainingTime = (Number(v.ttl)) - Date.now();

    if (remainingTime < 0) remainingTime = -2;

    return remainingTime;
};

export const sleep = async (delayMs: number) => await new Promise((res, rej) => setTimeout(res, delayMs));