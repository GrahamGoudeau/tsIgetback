import * as crypto from 'crypto';
import * as tsmonad from 'tsmonad';

const Maybe = tsmonad.Maybe;
type Maybe<T> = tsmonad.Maybe<T>;

const algorithm = 'aes-256-ctr';
const hash = 'sha512';
const encoding: crypto.Utf8AsciiBinaryEncoding = 'utf8';
const formatBinary: crypto.HexBase64BinaryEncoding = 'hex';
const formatLatin: crypto.HexBase64Latin1Encoding = 'hex';
const password = process.env.CRYPT_PASS;

export function encrypt(text: string): string {
    const cipher = crypto.createCipher(algorithm, password);
    const encrypted = cipher.update(text, encoding, formatBinary);

    return encrypted + cipher.final(formatBinary);
}

export function decrypt(encrypted: string): string {
    const decipher = crypto.createDecipher(algorithm, password);
    const dec = decipher.update(encrypted, formatBinary, encoding);

    return dec + decipher.final(encoding);
}

export function hashPassword(salt: string, password: string): string {
    const hashMethod = crypto.createHmac(hash, salt);
    hashMethod.update(password);
    return hashMethod.digest(formatLatin);
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
    const fail = Maybe.nothing<AuthToken>();
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
        const result: any = JSON.parse(this.decrypt(token));
        if (result.email && result.authorizedAt) {
            return Maybe.just(result);
        }
    } catch (e) {
        console.trace('JSON exception parsing cookie:', e);
        console.trace('JSON:', decrypt(token));
    }

    return fail;
}

export function validateCookie(cookie: string): boolean {
    const tokenResult: Maybe<AuthToken> = parseCookie(cookie);
    const currentTime = new Date();
    const oneHour = 3600000;

    return tokenResult.caseOf({
        just: (token: AuthToken) => {
            const expiresAt = new Date(token.authorizedAt.getTime() + oneHour);
            return expiresAt > currentTime;
        },
        nothing: () => false
    });
}
