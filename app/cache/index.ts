import type { TValue } from "../interfaces";
import { isExpired } from "../services";

export const DATA_MAP = new Map();

export const get = (k: string) => DATA_MAP.get(k);
export const set = (k: string, v: TValue) => DATA_MAP.set(k, v);
export const del = (k: string) => DATA_MAP.delete(k);
export const getKeys = () => DATA_MAP.keys();

export const expiryLoop = () => {
    getKeys().forEach(k => {
        const v = get(k);
        if (!v.v) return;
        if (!!v.ttl && !!v.type) {
            const expired = isExpired(v);
            if (expired) del(k);
        }
    });
};