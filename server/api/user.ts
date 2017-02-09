import * as db from './db';
import * as utils from '../utils/functionalUtils';
import { badRequest, jsonResponse, internalError, successResponse, unauthorizedError, AuthToken } from '../utils/requestUtils';
import * as models from './models';
import * as express from 'express';
import * as security from './security';
import { LoggerModule } from './logger';
import { getEmailerInstance, IEmailer } from './emailer';
import * as mongoose from 'mongoose';
import { IGetBackConfig } from '../config';

const log = new LoggerModule('user');
const emailer: IEmailer = getEmailerInstance();
const config: IGetBackConfig = IGetBackConfig.getInstance();
type DatabaseResult<T> = db.DatabaseResult<T>;
type IUser = models.IUser;
type ObjectIdTs = models.ObjectIdTs;

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
                    const recordUUID: string = await db.createVerificationRecord(newUser.email);
                    const emailSendSuccess: boolean = await emailer.userVerification(newUser.firstName, newUser.email, recordUUID);

                    // if the email failed (e.g. hit our limit), manually verify
                    if (!emailSendSuccess && config.getBooleanConfig('PRODUCTION')) {
                        badRequest(res, 'could not send email');
                        return;
                    } else if (!emailSendSuccess) {
                        await db.verifyUser({email: newUser.email});
                    }

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
                            authToken: security.buildAuthToken(user.email),
                            user: user
                        });
                    } else {
                        badRequest(res, 'user not verified');
                    }
                },
                left: async error => {
                    if (error === db.DatabaseErrorMessage.NOT_FOUND) {
                        unauthorizedError(res, 'could not find user');
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

export async function handleGetAccount(req: express.Request, res: express.Response, token: AuthToken): Promise<void> {
    const userResult = await db.getUserFromEmail({email: token.email});
    userResult.caseOf({
        left: e => badRequest(res, 'user not found'),
        right: user => jsonResponse(res, user)
    });
}

export async function handleVerify(req: express.Request, res: express.Response): Promise<void> {
    if (!req.params.recordId) {
        badRequest(res, 'no uuid specified');
        return;
    }
    const recordId: string = req.params.recordId;
    const objIdTest = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
    if (!objIdTest.test(recordId)) {
        badRequest(res, 'bad verification id');
        return;
    }

    const recResult: db.DatabaseResult<models.IUserVerificationRecord> = await db.getVerificationRecord(recordId);
    await recResult.caseOf({
        left: async e => {
            badRequest(res, 'bad verification id');
        },
        right: async rec => {
            await db.verifyUser({email: rec.email})
            res.redirect('/login');
        }
    });
}

export async function handleSubscribe(req: express.Request,
                                      res: express.Response,
                                      authToken: AuthToken,
                                      tripType: db.AddToCampusOrAirport
                                     ): Promise<void> {
    if (!req.body || !req.body.tripDate ||
            !req.body.airport || !req.body.college ||
            !req.body.tripHour || !req.body.tripQuarterHour) {
        badRequest(res, 'missing fields');
        return;
    }
    const tripDateStr = req.body.tripDate;
    if (!utils.dateRegex.test(tripDateStr)) {
        badRequest(res, 'date must be in mm/dd/yyyy format');
        return;
    }
    const tripDate = new Date(tripDateStr);

    const subscription: models.ISubscription = {
        email: authToken.email,
        tripDate: tripDate,
        airport: req.body.airport,
        college: req.body.college,
        tripHour: req.body.tripHour,
        tripQuarterHour: req.body.tripQuarterHour,
        dateCreated: new Date()
    };
    await db.subscribeUser(subscription, tripType);
    successResponse(res);
}

export async function handleGetSubscriptions(req: express.Request,
                                             res: express.Response,
                                             authToken: AuthToken,
                                             tripType: db.AddToCampusOrAirport): Promise<void> {
    const results: db.DatabaseResult<models.ISubscriptionModel[]> = await db.getSubscriptions(authToken.email, tripType);
    results.caseOf({
        right: subscriptions => jsonResponse(res, subscriptions),
        left: e => {
            log.ERROR('Could not get subscriptions:', e);
            internalError(res);
        }
    });
}

export async function handleUnsubscribe(req: express.Request,
                                        res: express.Response,
                                        authToken: AuthToken,
                                        tripType: db.AddToCampusOrAirport): Promise<void> {
    if (!req.params.subscriptionId) {
        badRequest(res, 'missing URL param');
        return;
    }
    let subscriptionId: ObjectIdTs;
    try {
        subscriptionId = mongoose.Types.ObjectId(req.params.subscriptionId);
    } catch (e) {
        log.DEBUG('failed to convert to mongo object ID', req.params.subscriptionId);
        badRequest(res, 'bad subscription ID');
        return;
    }

    try {
        await db.unsubscribe(subscriptionId, tripType);
    } catch (e) {
        log.ERROR('Could not unsubscribe:', e.message);
        internalError(res);
    }
    successResponse(res);
}
