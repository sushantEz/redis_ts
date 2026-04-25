import { USERS } from "../cache/data";
import type { TAuthenticConn } from "../interfaces";
import { generatePassword } from "../utils/password";

export const acl = (conn: TAuthenticConn, [f, ...r]: string[]) => {
    switch (f.toLowerCase()) {
        case "whomai": whomai(conn); break;
        case "getuser": getuser(conn, r); break;
        case "setuser": setuser(conn, r); break;
        case "deluser": deluser(conn, r); break;
        case "users": users(conn); break;
        case "genpass": genpass(conn, r); break;
    }
};

const whomai = (conn: TAuthenticConn) => {
    const user = USERS.get(conn.user);
    conn.write(JSON.stringify({ [conn.user]: user?.role }) + "\r\n");
    return;
};
const getuser = (conn: TAuthenticConn, [r]: string[]) => {
    const user = USERS.get(r);
    if (user) {
        const { pwds, ...restUser } = user;
        conn.write(JSON.stringify(restUser) + "\r\n");
    } else conn.write("{}\r\n");
    return;
};
const setuser = (conn: TAuthenticConn, r: string[]) => {
    let [ur, ...rest] = r;
    const u = USERS.getKeys().find(e => e == ur);
    if (u) {
        conn.write("ERR user already exists\r\n");
        return;
    }
};
const deluser = (conn: TAuthenticConn, r: string[]) => {
    let c = 0;
    for (const u of r) {
        if (USERS.del(u)) c++;
    }
    conn.write(c + "\r\n");
    return;
};
const users = (conn: TAuthenticConn) => {
    conn.write(JSON.stringify(USERS.getKeys()) + "\r\n");
    return;
};
const genpass = (conn: TAuthenticConn, [r = "512"]: string[]) => {
    let bits = Number(r);
    if (!bits || isNaN(bits)) bits = 512;
    const pwd = generatePassword(bits);
    conn.write(pwd + "\r\n");
    return;
};