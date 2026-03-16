import { get, set } from "../cache/data";
import * as connMap from "../cache/netSoc";
import { ETtlType, tokens } from "../interfaces";
import { isExpired } from "../services/data";
import { DoublyLinkedList } from "../services/doublyLinkedList";

export const push = (conn: any, flag: "r" | "l", rest: string[]) => {
    const [k, ...v] = rest;
    if (!(!!k) || typeof k != "string") { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (!(!!v)) { conn.write("ERROR: Key must be followed by a Value\r\n"); return; }

    if (tokens.includes(k.toLowerCase())) { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (rest.some(e => tokens.includes(e.toLowerCase()))) { conn.write("ERROR: Parameters must be valid values\r\n"); return; }

    let listExists = get(k);

    if (listExists && listExists.ttl && isExpired(listExists)) listExists = undefined;
    if (!listExists || !(listExists.v instanceof DoublyLinkedList)) {
        listExists = {
            v: new DoublyLinkedList(),
            ttl: "",
            ttlType: ETtlType.NONE,
            at: Date.now()
        };
    }

    if (flag === "r") {
        for (const e of v) {
            (listExists.v as DoublyLinkedList).rpush(e);
        }
    } else if (flag === "l") {
        for (const e of v) {
            (listExists.v as DoublyLinkedList).lpush(e);
        }
    }

    set(k, listExists);
    conn.write((listExists.v as DoublyLinkedList).llen() + "\r\n");
    connMap.get(k)?.forEach(v => {
        v.conn.resume();
        bpop(v.conn, flag, [k, "0"]);
        // v.conn.write((listExists.v as DoublyLinkedList).llen() + "\r\n" + listExists.v + "\r\n");
        connMap.del(k);
    });

    return;
};

export const pop = (conn: any, flag: "r" | "l", rest: string[]) => {
    const [k] = rest;
    if (!(!!k) || typeof k != "string") { conn.write("ERROR: Key must be a valid String\r\n"); return; }

    const listExists = get(k);
    if (!listExists || listExists.ttl && isExpired(listExists)) { conn.write("nil\r\n"); return; }
    if (!(listExists.v instanceof DoublyLinkedList)) { conn.write("ERROR: Key does not contain a List\r\n"); return; }

    let val;
    if (flag === "r") {
        val = listExists.v.rpop();
    } else if (flag === "l") {
        val = listExists.v.lpop();
    }

    set(k, listExists);
    if (!val) { conn.write("nil\r\n"); return; }
    conn.write(`$${val.length}\r\n${val}\r\n`);
    return;
};

export const lrange = (conn: any, rest: string[]) => {
    const [k, start, stop] = rest;
    if (!k || typeof k != "string") { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (isNaN(Number(start)) || isNaN(Number(stop))) { conn.write("ERROR: Start and Stop must be valid numbers\r\n"); return; }

    const listExists = get(k);

    if (!listExists || listExists.ttl && isExpired(listExists)) { conn.write("nil\r\n"); return; }
    if (!(listExists.v instanceof DoublyLinkedList)) { conn.write("ERROR: Key does not contain a List\r\n"); return; }

    const vals = listExists.v.lrange(Number(start), Number(stop));
    if (!vals.length) { conn.write("nil\r\n"); return; }
    conn.write(vals.map((v: string) => `$${v.length}\r\n${v}\r\n`).join(""));
    return;
};
export const llen = (conn: any, [k]: string[]) => {
    if (!k || typeof k != "string") { conn.write("ERROR: Key must be a valid String\r\n"); return; }

    const listExists = get(k);
    if (!listExists || listExists.ttl && isExpired(listExists)) { conn.write("0\r\n"); return; }
    if (!(listExists.v instanceof DoublyLinkedList)) { conn.write("ERROR: Key does not contain a List\r\n"); return; }

    conn.write(listExists.v.llen() + "\r\n");
    return;
};

export const bpop = (conn: any, flag: "r" | "l", [k, timeout]: string[]) => {
    if (!k || typeof k != "string" || tokens.includes(k)) { conn.write("ERROR: Key must be a valid String\r\n"); return; }
    if (timeout != "" && isNaN(Number(timeout))) { conn.write("ERROR: Wrong number of arguments for command\r\n"); return; }

    const listExists = get(k);
    if (!listExists || (listExists.ttl && isExpired(listExists))) {
        conn.pause();
        connMap.set(k, { conn, timeout: Number(timeout), at: Date.now() });
        return;
    }
    else if (!(listExists.v instanceof DoublyLinkedList)) { conn.write("ERROR: Key does not contain a List\r\n"); return; }
    else if (listExists.v.llen() > 0) {
        let val;
        if (flag === "r") {
            val = listExists.v.rpop();
        } else if (flag === "l") {
            val = listExists.v.lpop();
        }

        set(k, listExists);
        if (!val) { conn.write("nil\r\n"); return; }
        conn.write(`$${val.length}\r\n${val}\r\n`);
        return;
    } else if (listExists.v.llen() <= 0) {
        conn.pause();
        connMap.set(k, { conn, timeout: Number(timeout), at: Date.now() });
        return;
    }
};

// we'll implement the rest of the list commands later, for now we can just implement the basic ones
// testing out the list functionality and blocking pop functionality remains
// TODO:  TEST BLOCKING OPERATIONS
// then well implement rest commands which are 
/*
1. Push & Pop (Core)

* LPUSH key value [value ...] — Add to the head (left).
* RPUSH key value [value ...] — Add to the tail (right).
* LPOP key [count] — Remove and get the first element.
* RPOP key [count] — Remove and get the last element.
* LPUSHX key value [value ...] — Push to head only if key exists.
* RPUSHX key value [value ...] — Push to tail only if key exists.

2. Inspection & Retrieval

* LLEN key — Get the length of the list.
* LRANGE key start stop — Get a range of elements (inclusive).
* LINDEX key index — Get an element by its index.
* LPOS key element [RANK rank] [COUNT num] [MAXLEN len] — Find the position of an element.

3. Modification & Removal

* LSET key index value — Update an element at a specific index.
* LTRIM key start stop — Trim the list to the specified range.
* LREM key count value — Remove specific occurrences of a value.
* LINSERT key BEFORE|AFTER pivot value — Insert a value near another value.

4. Atomic & Moving

* LMOVE source destination LEFT|RIGHT LEFT|RIGHT — Move an element between lists.
* RPOPLPUSH source destination — (Legacy) Move the last item of one list to the start of another.

5. Blocking (Queues)

* BLPOP key [key ...] timeout — Wait to pop from the head.
* BRPOP key [key ...] timeout — Wait to pop from the tail.
* BLMOVE source destination LEFT|RIGHT LEFT|RIGHT timeout — Wait to move an element.
* LMPOP numkeys key [key ...] LEFT|RIGHT [COUNT count] — Pop from the first non-empty list.
* BLMPOP timeout numkeys key [key ...] LEFT|RIGHT [COUNT count] — Blocking version of LMPOP.

*/