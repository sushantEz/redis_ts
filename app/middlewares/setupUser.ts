import { USERS } from "../cache/data";
import { sendMsgAndDestroy } from "../helpers";
import type { TAuthenticConn } from "../interfaces";
import { hashPassword } from "../utils/password";

export const setupRoot = (conn: TAuthenticConn, r: string[]) => {
    if (r.length !== 4) return sendMsgAndDestroy(conn, "NOAUTH, no root user found\r\n Setup root user first\r\n Command: AUTH -u <user> -p <password>");
    const [uf, u, pf, p] = r;
    if (!uf || !pf) return sendMsgAndDestroy(conn, "AUTH failed, invalid flags");
    if (!u.trim() || !p.trim()) return sendMsgAndDestroy(conn, "AUTH failed, invalid user or password");
    USERS.set(u, {
        pwds: [hashPassword(p)],
        flgs: [],
        ks: [],
        cmds: [],
        chnls: [],
        role: "root_user"
    });
    conn.isAuthentic = true;
    conn.user = u;
    console.log(USERS);
    return;
};