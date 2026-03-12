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
    }
    return expired;
};

export const sleep = async (delayMs: number) => await new Promise((res, rej) => setTimeout(res, delayMs));