import type { TConnMapData } from "../interfaces";

export class NetConnStore<k extends string, v extends TConnMapData[]> {
    store: Map<k, v>;
    constructor(ms: number) {
        this.store = new Map<k, v>();
        setInterval(this.expireLoop, ms);
    }

    get = (k: k) => this.store.get(k);
    set = (k: k, v: v) => { };
    del = (k: k) => this.store.delete(k);

    expireLoop = () => this.connExpiryLoop();

    connExpiryLoop = () => {
        const ks = this.store.keys();
        if (!ks || !(ks instanceof Iterator)) return;
        ks.forEach((k: k) => {
            const vs = this.get(k);
            if (!vs || !vs.length) return;
            vs.forEach(v => {
                if (!v || !v.conn || Number(v.timeout) == 0) return;
                if (!isNaN(Number(v.timeout)) && Date.now() - (Number(v.timeout) * 1000) > v.at) {
                    v.conn.resume();
                    v.conn.write("nil\r\n");
                    this.del(k);
                }
            });
        });
    };
}