import * as crypto from 'crypto';
import * as tsmonad from 'tsmonad';
import * as db from './db';
import * as models from './models';
import * as utils from './utils';
import { LoggerModule } from './logger';

const log = new LoggerModule('security');
const Maybe = tsmonad.Maybe;
type Maybe<T> = tsmonad.Maybe<T>;
type ObjectIdTs = models.ObjectIdTs;

const algorithm = 'aes-256-ctr';
const hash = 'sha512';
const encoding: crypto.Utf8AsciiBinaryEncoding = 'utf8';
const formatBinary: crypto.HexBase64BinaryEncoding = 'hex';
const formatLatin: crypto.HexBase64Latin1Encoding = 'hex';
const password = process.env.CRYPT_PASS;
if (!password) {
    log.ERROR('CRYPTO PASSWORD NOT SET - EXCEPTIONS WILL BE RAISED');
}

export function encrypt(text: string): string {
    try {
        const cipher = crypto.createCipher(algorithm, password);
        const encrypted = cipher.update(text, encoding, formatBinary);

        return encrypted + cipher.final(formatBinary);
    } catch (e) {
        log.ERROR('crypto error in encrypt', e.message);
        throw e;
    }
}

export function decrypt(encrypted: string): string {
    try {
        const decipher = crypto.createDecipher(algorithm, password);
        const dec = decipher.update(encrypted, formatBinary, encoding);

        return dec + decipher.final(encoding);
    } catch (e) {
        log.ERROR('crypto error in decrypt', e.message);
        throw e;
    }
}

export function hashPassword(salt: string, password: string): string {
    try {
        const hashMethod = crypto.createHmac(hash, salt);
        hashMethod.update(password);
        return hashMethod.digest(formatLatin);
    } catch (e) {
        log.ERROR('could not hash password', password, 'with salt', salt, 'internal message:', e.message);
        // TODO: probably a bad idea?
        throw e;
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
        log.ERROR('JSON exception parsing cookie:', e.message);
        log.ERROR('JSON:', decrypt(token));
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

/**
 * @returns true if an email was sent, false if the user had to be manually verified (no email)
 */
export async function sendVerificationEmail(email: string): Promise<boolean> {
    const recordId: ObjectIdTs = await db.createVerificationRecord(email);
    const sendSuccess = false;
    if (process.env.PRODUCTION === 'true') {
        // send the email to the user
        const verifyLink = `${utils.DOMAIN_NAME}/${utils.VERIFY_ENDPOINT}/${recordId}`;
        log.INFO('Sending link:', verifyLink);
    }

    if (!sendSuccess) {
        log.INFO('Failed to send verification email to user', email);
        await db.verifyUser({email: email});
        return false;
    }

    return true;
}
