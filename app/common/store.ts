import type { TBoolCallback, TNumCallback } from "../interfaces";

export class Store<k, v> {
    private store: Map<k, v>;
    isExpired: TBoolCallback<v>;
    calcRemainTime: TNumCallback<v>;

    constructor(ms: number, isExpired: TBoolCallback<v>, calcRemainTime: TNumCallback<v>) {
        this.store = new Map<k, v>();
        this.isExpired = isExpired;
        this.calcRemainTime = calcRemainTime;
        setInterval(this.expiryLoop, ms);
    }

    get = (k: k) => this.store.get(k);
    set = (k: k, v: v) => this.store.set(k, v);
    del = (k: k) => this.store.delete(k);
    getKeys = () => Array.from(this.store.keys());

    expiryLoop = () => this.expiryCallback();

    expiryCallback = () => {
        this.getKeys().forEach((k: k) => {
            const v = this.get(k);
            if (!v || Object.keys(v).length) return;
            const expired = this.isExpired(v);
            if (expired) this.del(k);
        });
    };
}

