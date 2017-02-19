import * as db from '../db/dbClient';
import { badRequest, jsonResponse, internalError, successResponse, unauthorizedError, AuthToken } from '../utils/requestUtils';
import * as models from '../db/models';
import * as express from 'express';
import { Validator } from 'validator.ts/Validator';
import * as security from '../utils/security';
import { LoggerModule } from '../utils/logger';
import { getEmailerInstance, IEmailer } from './emailer';
import * as mongoose from 'mongoose';
import { IGetBackConfig } from '../utils/config';
import { buildValidRequest, UserCreateRequest, UserLoginRequest, UserSubscribeRequest } from '../utils/requestValidation';

const log = new LoggerModule('user');
const emailer: IEmailer = getEmailerInstance();
const config: IGetBackConfig = IGetBackConfig.getInstance();
const validator: Validator = new Validator();
type DatabaseResult<T> = db.DatabaseResult<T>;
type IUser = models.IUser;
type ObjectIdTs = models.ObjectIdTs;

export async function handleCreateUser(req: express.Request, res: express.Response): Promise<void> {
    const obj: any = req.body;
    if (!obj) {
        badRequest(res);
        return;
    }

    const request: UserCreateRequest = buildValidRequest(UserCreateRequest, obj);
    let validRequest: UserCreateRequest;
    try {
        validRequest = await validator.sanitizeAndValidateAsync<UserCreateRequest>(request);
    } catch (e) {
        badRequest(res, 'failed to validate trip', e.message);
        log.DEBUG('failed to validate trip', e.message);
        return;
    }

    try {
        const normalizedEmail: string = validRequest.email.toUpperCase();
        const newUser: DatabaseResult<IUser> = await db.createUser(validRequest.firstName,
                                                                   validRequest.lastName,
                                                                   normalizedEmail,
                                                                   validRequest.password);
        newUser.caseOf({
            right: async newUser => {
                const recordUUID: string = await db.createVerificationRecord(newUser.email);
                const emailSendSuccess: boolean = await emailer.userVerification(newUser.firstName, newUser.email, recordUUID);

                // if the email failed (e.g. hit our limit), manually verify
                if (!emailSendSuccess && config.getBooleanConfig('PRODUCTION')) {
                    badRequest(res, 'could not send email');
                    return;
                } else if (!emailSendSuccess) {
                    log.INFO('Verifying user', newUser.email, 'automatically');
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
}

export async function handleDelete(req: express.Request, res: express.Response): Promise<void> {
    if (!req.body) {
        badRequest(res);
        return;
    }

    if (req.body.email) {
        db.deleteUser({email: req.body.email.toUpperCase()});
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

    const request: UserLoginRequest = buildValidRequest(UserLoginRequest, obj);
    let validRequest: UserLoginRequest;
    try {
        validRequest = await validator.sanitizeAndValidateAsync<UserLoginRequest>(request);
    } catch (e) {
        badRequest(res, 'could not validate login request');
        return;
    }

    try {
        const query: db.UserPasswordQuery = {
            email: validRequest.email,
            password: validRequest.password
        };
        const dbResult: DatabaseResult<IUser> = await db.getUserFromEmailAndPassword(query);
        const email: string = query.email.toUpperCase();
        dbResult.caseOf({
            right: async user => {
                if (user.verified) {
                    await db.recordLogin({email: email});
                    jsonResponse(res, {
                        authToken: security.buildAuthToken(email),
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
            await db.verifyUser({email: rec.email.toUpperCase()})
            res.redirect('/login');
        }
    });
}

export async function handleSubscribe(req: express.Request,
                                      res: express.Response,
                                      authToken: AuthToken,
                                      tripType: db.AddToCampusOrAirport
                                     ): Promise<void> {

    if (!req.body) {
        badRequest(res, 'missing fields');
        return;
    }
    const request: UserSubscribeRequest = buildValidRequest(UserSubscribeRequest, req.body);
    let validRequest: UserSubscribeRequest;
    try {
        validRequest = await validator.sanitizeAndValidateAsync<UserSubscribeRequest>(request);
    } catch (e) {
        badRequest(res, 'could not validate subscribe request', e.message);
        return;
    }

    const subscription: models.ISubscription = {
        email: authToken.email,
        tripDate: validRequest.tripDate,
        airport: validRequest.airport,
        college: validRequest.college,
        tripHour: validRequest.tripHour,
        tripQuarterHour: validRequest.tripQuarterHour,
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
