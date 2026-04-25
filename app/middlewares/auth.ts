import { USERS } from "../cache/data";
import { sendMsgAndDestroy } from "../helpers";
import type { TAuthenticConn } from "../interfaces";
import { verifyPassword } from "../utils/password";
import { setupRoot } from "./setupUser";

export const authenticate = (conn: TAuthenticConn, f: string, r: string[]): boolean => {
    if (!USERS.getKeys().length || !USERS.rootExists("role", "root_user")) {
        setupRoot(conn, r);
        return true;
    }
    conn.pause();
    if (f.toLowerCase() != "auth") return sendMsgAndDestroy(conn, "NOAUTH authentication required\r\n");
    if (r.length !== 2) return sendMsgAndDestroy(conn, "AUTH failed, user and password are required\r\n");
    const user = USERS.get(r[0]);
    if (!user) return sendMsgAndDestroy(conn, "AUTH failed, user not found\r\n");
    const isPasswordCorrect = user.pwds.find(pwd => verifyPassword(r[1], pwd));
    if (!isPasswordCorrect) return sendMsgAndDestroy(conn, "NOAUTH invalid password\r\n");
    conn.isAuthentic = true;
    conn.user = r[0];
    conn.resume();
    return conn.isAuthentic;
};
