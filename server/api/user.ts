import * as db from './db';
import * as utils from './utils';
import { badRequest, jsonResponse, internalError } from './utils';
import * as models from './models';
import * as express from 'express';
import * as security from './security';
import { LoggerModule } from './logger';

const log = new LoggerModule('user');
type DatabaseResult<T> = db.DatabaseResult<T>;
type IUser = models.IUser;

export async function handleCreateUser(req: express.Request, res: express.Response): Promise<void> {
    const obj: any = req.body;
    if (!obj) {
        badRequest(res);
        return;
    }

    if (obj.firstName && obj.lastName && obj.email && obj.password) {
        try {
            const newUser: DatabaseResult<IUser> = await db.createUser(obj.firstName,
                                                                       obj.lastName,
                                                                       obj.email,
                                                                       obj.password);
            newUser.caseOf({
                right: async newUser => {
                    const emailSendSuccess = await security.sendVerificationEmail(newUser.email);
                    jsonResponse(res, {
                        newUser: newUser,
                        emailSendSuccess: emailSendSuccess
                    });
                    return true;
                },
                left: async error => {
                    if (error === db.DatabaseErrorMessage.USER_EXISTS) {
                        badRequest(res, 'email exists');
                    } else {
                        badRequest(res, 'other error');
                    }
                    return false;
                }
            });
        } catch (e) {
            const msg = 'exception while creating user';
            log.ERROR(msg, e.message);
            internalError(res, msg);
            return;
        }
    } else {
        badRequest(res, 'missing fields');
    }
}

export async function handleDelete(req: express.Request, res: express.Response): Promise<void> {
    if (!req.body) {
        badRequest(res);
        return;
    }

    if (req.body.email) {
        db.deleteUser({email: req.body.email});
    } else {
        badRequest(res, 'missing email field');
    }
}

export async function handleLogin(req: express.Request, res: express.Response): Promise<void> {
    const obj: any = req.body;
    if (!obj) {
        badRequest(res);
        return;
    }

    if (obj.email && obj.password) {
        try {
            const query: db.UserPasswordQuery = obj;
            const dbResult: DatabaseResult<IUser> = await db.getUserFromEmailAndPassword(query);
            dbResult.caseOf({
                right: async user => {
                    if (user.verified) {
                        await db.recordLogin({email: user.email});
                        jsonResponse(res, {
                            authToken: security.buildAuthToken(user.email)
                        });
                    } else {
                        badRequest(res, 'user not verified');
                    }
                },
                left: async error => {
                    if (error === db.DatabaseErrorMessage.NOT_FOUND) {
                        utils.unauthorizedError(res, 'could not find user');
                    } else {
                        badRequest(res);
                    }
                }
            });
        } catch (e) {
            const msg = 'exception while logging in';
            log.ERROR(msg, e.message);
            internalError(res, msg);
        }
    } else {
        badRequest(res);
    }
}

export async function handleGetAccount(req: express.Request, res: express.Response, token: security.AuthToken): Promise<void> {
    const userResult = await db.getUserFromEmail({email: token.email});
    userResult.caseOf({
        left: e => badRequest(res, 'user not found'),
        right: user => jsonResponse(res, user)
    });
}

export async function handleVerify(req: express.Request, res: express.Response): Promise<void> {
    const recResult: db.DatabaseResult<models.IUserVerificationRecord> = await db.getVerificationRecord(req.params.tripId);
    await recResult.caseOf({
        left: async e => badRequest(res, 'bad verification id'),
        right: async rec => {
            await db.verifyUser({email: rec.email})
            res.redirect('/login');
        }
    });
}
