import crypto from "crypto";

export const hashPassword = (password: string) => {
    const algo = "pbkdf2";
    const digest = "sha512";
    const salt = crypto.randomBytes(16).toString("hex");
    const prefix = crypto.randomBytes(16).toString("hex");
    const iterations = 100_000;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return `$${prefix}$${algo}$${digest}$${iterations}$${salt}$${hash}`;
};

export const verifyPassword = (password: string, stored: string) => {
    const parts = stored.split("$").filter(Boolean);
    const [_, algo, digest, iterationsStr, salt, originalHash] = parts;
    if (algo !== "pbkdf2") return false;
    const iterations = parseInt(iterationsStr, 10);
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, digest);
    const originalBuffer = Buffer.from(originalHash, "hex");
    return crypto.timingSafeEqual(hash, originalBuffer);
};

export const generatePassword = (bits: number) => {
    return crypto.randomBytes(bits / 4).toString("hex");
};