import type { TConnMapData } from "../interfaces";

export class NetConnStore<k extends string, v extends TConnMapData[]> {
    private store: Map<k, v>;
    constructor(ms: number) {
        this.store = new Map<k, v>();
        setInterval(this.expireLoop, ms);
    }

    get = (k: k) => this.store.get(k);
    set = (k: k, v: TConnMapData) => {
        let vs = this.store.get(k) || [] as unknown as v;
        vs.push(v);
        this.store.set(k, vs);
        return;
    };
    del = (k: k) => this.store.delete(k);
    keys = () => this.store.keys();
    setArr = (k: k, v: v) => this.store.set(k, v);

    expireLoop = () => this.connExpiryLoop();

    connExpiryLoop = () => {
        const ks = this.store.keys();
        if (!ks || !(ks instanceof Iterator)) return;
        for (const [k, vs] of this.store) {
            if (!vs || !vs.length) continue;
            let bl = vs.filter(v => {
                if (!v || !v.conn || v.timeout == 0) return true;
                if (Date.now() - v.at >= v.timeout) {
                    v.conn.resume();
                    v.conn.write("nil\r\n");
                    return false;
                }
                return true;
            });
            if (bl.length) this.setArr(k, bl as v);
            else this.del(k);
        };
    };
}