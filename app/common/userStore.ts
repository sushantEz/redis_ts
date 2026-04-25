export class UserStore<k, v> {
    private store: Map<k, v>;
    constructor() {
        this.store = new Map();
    }

    get = (k: k) => this.store.get(k);
    set = (k: k, v: v) => this.store.set(k, v);
    del = (k: k) => this.store.delete(k);
    rootExists = (key: keyof v, value: string) => Array.from(this.store.values()).find(e => e[key] === value);
    getKeys = () => Array.from(this.store.keys());
}