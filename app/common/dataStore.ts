import type { TBoolCallback, TNumCallback, TStreamValue, TValue } from "../interfaces";
import { Store } from "./store";

export class DataStore<k, v extends TValue> extends Store<k, v> {
    constructor(ms: number, isExpired: TBoolCallback<v>, calcRemainTime: TNumCallback<v>) {
        super(ms, isExpired, calcRemainTime);
    }
}

export class StreamStore<k, v extends TStreamValue> extends Store<k, v> {
    constructor(ms: number, isExpired: TBoolCallback<v>, calcRemainTime: TNumCallback<v>) {
        super(ms, isExpired, calcRemainTime);
    }
}