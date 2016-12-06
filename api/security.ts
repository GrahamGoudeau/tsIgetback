import * as crypto from 'crypto';
import * as tsmonad from 'tsmonad';
import * as db from './db';

const Maybe = tsmonad.Maybe;
type Maybe<T> = tsmonad.Maybe<T>;

const algorithm = 'aes-256-ctr';
const hash = 'sha512';
const encoding: crypto.Utf8AsciiBinaryEncoding = 'utf8';
const formatBinary: crypto.HexBase64BinaryEncoding = 'hex';
const formatLatin: crypto.HexBase64Latin1Encoding = 'hex';
const password = process.env.CRYPT_PASS;

export function encrypt(text: string): string {
    try {
        const cipher = crypto.createCipher(algorithm, password);
        const encrypted = cipher.update(text, encoding, formatBinary);

        return encrypted + cipher.final(formatBinary);
    } catch (e) {
        console.trace('crypto error in encrypt', e);
        return '';
    }
}

export function decrypt(encrypted: string): string {
    try {
        const decipher = crypto.createDecipher(algorithm, password);
        const dec = decipher.update(encrypted, formatBinary, encoding);

        return dec + decipher.final(encoding);
    } catch (e) {
        console.trace('crypto error in decrypt', e);
        return '';
    }
}

export function hashPassword(salt: string, password: string): string {
    try {
        const hashMethod = crypto.createHmac(hash, salt);
        hashMethod.update(password);
        return hashMethod.digest(formatLatin);
    } catch (e) {
        console.trace('could not hash password', password, 'with salt', salt, 'e:', e);
        // TODO: probably a bad idea?
        return null;
    }
}

export interface AuthToken {
    email: string,
    authorizedAt: Date
}

export function buildAuthToken(email: string): string {
    const token: AuthToken = {
        email: email,
        authorizedAt: new Date()
    };

    return encrypt(JSON.stringify(token));
}

export function parseCookie(cookie: string): Maybe<AuthToken> {
    const fail: Maybe<AuthToken> = Maybe.nothing<AuthToken>();
    if (!cookie) {
        return fail;
    }

    const cookiePrelude: string = 'IgetbackAuth=';
    const authRegex = new RegExp(`${cookiePrelude}([a-f0-9]+)`);
    const match: RegExpExecArray = authRegex.exec(cookie);

    if (match == null) {
        return fail;
    }

    const token: string = match[1];
    try {
        const deserializedResult: any = JSON.parse(decrypt(token));
        if (!deserializedResult.email || !deserializedResult.authorizedAt) {
            return fail;
        }
        const result: AuthToken = {
            email: deserializedResult.email,
            authorizedAt: new Date(deserializedResult.authorizedAt)
        };

        return Maybe.just(result);
    } catch (e) {
        console.trace('JSON exception parsing cookie:', e);
        console.trace('JSON:', decrypt(token));
    }

    return fail;
}

export async function validateCookie(cookie: string): Promise<boolean> {
    const tokenResult: Maybe<AuthToken> = parseCookie(cookie);

    return await tokenResult.caseOf({
        just: async (token: AuthToken) => {
            return await validateAuthToken(token);
        },
        nothing: async () => false
    });
}

export async function validateAuthToken(token: AuthToken): Promise<boolean> {
    const currentTime = new Date();
    const oneHour = 3600000;
    const expiresAt = new Date(token.authorizedAt.getTime() + oneHour);
    const userExists: boolean = await db.doesUserExist({email: token.email});
    return expiresAt > currentTime && userExists;
}
