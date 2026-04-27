import * as fs from 'fs';
import * as readline from "readline";
import { aofDir, aofPath, EAFsync, EAOnly, type TAOFStates, type TAuthenticConn, type TSetAOFKey, type TSetAOFVal } from '../interfaces';
import { onData } from '../controllers';

export class AOF {
    private aofStates: TAOFStates;
    wStream!: fs.WriteStream;
    rStream!: fs.ReadStream;
    fd!: number;
    vc: TAuthenticConn;
    isRewriteInProgress: boolean;
    setAbles: string[];

    constructor(aofDir: string, aofPath: string) {

        this.isRewriteInProgress = false;
        this.aofStates = {
            aofpath: aofPath,
            aofdir: aofDir,
            appendonly: EAOnly.NO,
            appendfsync: EAFsync.EVERYSEC,
            autoaofrewritepercentage: 100,
            autoaofrewriteminsize: 64 * 1024 * 1024,
        };
        this.setAbles = Object.keys(this.aofStates).map(e => e.toLowerCase());
        this.initAOF();
        this.vc = this.initVC();

    }

    initAOF() {
        if (!fs.existsSync(this.aofStates.aofdir)) fs.mkdirSync(this.aofStates.aofdir, { recursive: true });
        if (!fs.existsSync(this.aofStates.aofpath)) fs.writeFileSync(aofPath, "");

        this.wStream = fs.createWriteStream(this.aofStates.aofpath, { flags: "a" });
        this.wStream.on("open", (fd) => { this.fd = fd; console.log("wStream opened"); });
        this.wStream.on("drain", () => console.warn("stream draning"));
        this.wStream.on("close", () => console.warn("stream closed"));
        this.wStream.on("error", (err) => console.error(err));
    }

    initVC() {
        return {
            write: (_: any) => { },
            pause: () => { },
            resume: () => { },
            destroy: () => { },
            end: () => { },
            remoteAddress: "127.0.0.1",
            remotePort: 0,
            isAuthentic: true,
            user: "default"
        } as TAuthenticConn;
    }

    getAOFStates = (p: TSetAOFKey) => this.aofStates[p];
    getProperty = (p: keyof AOF) => this[p];

    setProperty<k extends TSetAOFKey>(conn: TAuthenticConn, [p, v]: [k, TSetAOFVal]) {
        if (p.includes("-")) p = p.split("-").join("") as k;

        if (!this.setAbles.includes(p)) {
            conn.write("-ERR Invalid AOF property\r\n");
            return;
        }

        let parsedVal: any = null;

        switch (p) {
            case "appendonly":
                if (![EAOnly.YES, EAOnly.NO].includes(v as EAOnly)) {
                    conn.write("-ERR appendonly must be yes|no\r\n");
                    return;
                }
                parsedVal = v;
                break;

            case "appendfsync":
                if (![EAFsync.ALWAYS, EAFsync.EVERYSEC, EAFsync.NO].includes(v as EAFsync)) {
                    conn.write("-ERR appendfsync must be always|everysec|no\r\n");
                    return;
                }
                parsedVal = v;
                break;

            case "autoaofrewritepercentage":
                if (isNaN(Number(v)) || Number(v) < 0) {
                    conn.write("-ERR percentage must be a positive number\r\n");
                    return;
                }
                parsedVal = Number(v);
                break;

            case "autoaofrewriteminsize":
                if (isNaN(Number(v)) || Number(v) < 0) {
                    conn.write("-ERR min size must be a positive number\r\n");
                    return;
                }
                parsedVal = Number(v);
                break;

            case "aofpath":
            case "aofdir":
                parsedVal = String(v);
                break;

            default:
                conn.write("-ERR Unsupported property\r\n");
                return;
        }

        this.aofStates[p] = parsedVal;
        conn.write("OK\r\n");
    }

    writeToAOF(cmd: string) {
        if (this.isRewriteInProgress) return;

        this.wStream.write(cmd + "\n");

        if (this.aofStates.appendfsync == EAFsync.ALWAYS) this.fsync();
        else if (this.aofStates.appendfsync == EAFsync.EVERYSEC) this.everySec();

        return;
    }

    private fsync() {
        return fs.fsync(this.fd, () => console.log("fsynced"));
    }

    private everySec() {
        return setTimeout(this.fsync.bind(this), 1000);
    }

    loadAOF() {
        this.isRewriteInProgress = true;
        this.rStream = fs.createReadStream(this.aofStates.aofpath, { encoding: "utf-8" });
        const rl = readline.createInterface({ input: this.rStream, crlfDelay: Infinity });

        rl.on("line", (l) => {
            l = l.trim();
            if (!l) return;
            onData(this.vc, Buffer.from(l));
        });
        rl.on("close", () => this.isRewriteInProgress = false);
        rl.on("error", (err) => {
            console.error("AOF read error:", err);
            this.isRewriteInProgress = false;
        });
    }
}

export const aof = new AOF(aofDir, aofPath);