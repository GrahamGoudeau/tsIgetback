import * as tsmonad from 'tsmonad';
import * as db from './db';
import * as utils from './utils';
import * as models from './models';
import * as express from 'express';
import * as security from './security';

type DatabaseResult<T> = db.DatabaseResult<T>;
type IUser = models.IUser;

export async function handleCreateUser(req: express.Request, res: express.Response): Promise<void> {
    const obj: any = req.body;
    if (!obj) {
        utils.badRequest(res);
        return;
    }

    if (obj.firstName && obj.lastName && obj.email && obj.password) {
        try {
            const newUser: DatabaseResult<IUser> = await db.createUser(obj.firstName,
                                                                       obj.lastName,
                                                                       obj.email,
                                                                       obj.password);
            const success = newUser.caseOf({
                right: newUser => {
                    utils.jsonResponse(res, newUser);
                    return true;
                },
                left: error => {
                    if (error === db.DatabaseErrorMessage.USER_EXISTS) {
                        utils.badRequest(res, 'email exists');
                    } else {
                        utils.badRequest(res, 'other error');
                    }
                    return false;
                }
            });
        } catch (e) {
            const msg = 'exception while creating user';
            console.trace(msg, e);
            utils.internalError(res, msg);
            return;
        }
    } else {
        utils.badRequest(res, 'missing fields');
    }
}

export async function handleLogin(req: express.Request, res: express.Response): Promise<void> {
    const obj: any = req.body;
    if (!obj) {
        utils.badRequest(res);
    }

    if (obj.email && obj.password) {
        try {
            const query: db.UserPasswordQuery = obj;
            const dbResult: DatabaseResult<IUser> = await db.getUserFromEmailAndPassword(query);
            dbResult.caseOf({
                right: async user => {
                    const response: utils.IGetBackResponse = {
                        data: {
                            authToken: security.buildAuthToken(user.email)
                        }
                    };
                    utils.jsonResponse(res, {
                        authToken: security.buildAuthToken(user.email)
                    });
                    await db.recordLogin({email: user.email});
                },
                left: async error => {
                    if (error === db.DatabaseErrorMessage.USER_NOT_FOUND) {
                        utils.unauthorizedError(res, 'could not find user');
                    } else {
                        utils.badRequest(res);
                    }
                }
            });
        } catch (e) {
            const msg = 'exception while logging in';
            console.trace(msg, e);
            utils.internalError(res, msg);
        }
    } else {
        utils.badRequest(res);
    }
}
