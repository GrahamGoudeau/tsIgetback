import * as db from './db';
import * as utils from './utils';
import { badRequest, jsonResponse, internalError, successResponse } from './utils';
import * as models from './models';
import * as express from 'express';
import * as security from './security';
import * as mongoose from 'mongoose';
import { Validator } from "validator.ts/Validator";

const validator: Validator = new Validator();
type DatabaseResult<T> = db.DatabaseResult<T>;
type ITrip = models.ITrip;
type ObjectIdTs = models.ObjectIdTs;

async function handleTripCreate(req: express.Request,
                                res: express.Response,
                                authToken: security.AuthToken,
                                cont: (query: db.CreateTripQuery) => Promise<DatabaseResult<models.ITrip>>
                               ): Promise<models.ITripModel> {
    if (!req.body) {
        badRequest(res);
        return;
    }

    const toValidate = new models.Trip();
    for (let key in req.body) {
        toValidate[key] = req.body[key];
    }

    let tripRequest: models.Trip;
    try {
        tripRequest = await validator.sanitizeAndValidateAsync<models.Trip>(toValidate);
    } catch (e) {
        console.trace('failed to validate trip:', toValidate, e);
        throw e;
    }

    const query: db.CreateTripQuery = {
        ownerEmail: authToken.email,
        maxOtherMembers: tripRequest.maxOtherMembers,
        tripDate: tripRequest.tripDate,
        tripHour: tripRequest.tripHour,
        tripQuarterHour: tripRequest.tripQuarterHour,
        tripName: tripRequest.tripName,
        college: tripRequest.college,
        airport: tripRequest.airport
    };
    const createdTripResult: DatabaseResult<ITrip> = await cont(query);
    return await createdTripResult.caseOf({
        left: async (err: db.DatabaseErrorMessage) => {
            badRequest(res, 'could not save trip');
            throw new Error('could not save trip');
        },
        right: async (trip: models.ITripModel) => {
            return trip;
        }
    });
}

export async function handleFromCampusCreate(req: express.Request, res: express.Response, authToken: security.AuthToken): Promise<void> {
    let createdTrip: models.ITripModel;
    try {
        createdTrip = await handleTripCreate(req, res, authToken, db.createTripFromCampus);
    } catch (e) {
        console.trace('exception while creating trip from campus', e);
        badRequest(res, 'failed to create trip');
        return;
    }

    try {
        await db.addNewTripFromCampusToUser(createdTrip._id, authToken.email);
    } catch (e) {
        console.trace('Problem saving to user:', e);
        internalError(res, 'problem saving to user');
        return;
    }
    jsonResponse(res, createdTrip);
}

export async function handleFromAirportCreate(req: express.Request, res: express.Response, authToken: security.AuthToken): Promise<void> {
    let createdTrip: models.ITripModel;
    try {
        createdTrip = await handleTripCreate(req, res, authToken, db.createTripFromAirport);
    } catch (e) {
        console.trace('exception while creating trip from airport', e);
        badRequest(res, 'failed to create trip');
        return;
    }

    try {
        await db.addNewTripFromAirportToUser(createdTrip._id, authToken.email);
    } catch (e) {
        console.trace('Problem saving to user:', e);
        internalError(res, 'problem saving to user');
        return;
    }
    jsonResponse(res, createdTrip);
}

export async function handleJoinTripFromCampus(req: express.Request,
                                               res: express.Response,
                                               authToken: security.AuthToken
                                              ): Promise<void> {
    await handleJoinTrip(req, res, authToken, db.AddToCampusOrAirport.FROM_CAMPUS);
}

export async function handleJoinTripFromAirport(req: express.Request,
                                                res: express.Response,
                                                authToken: security.AuthToken
                                               ): Promise<void> {
    await handleJoinTrip(req, res, authToken, db.AddToCampusOrAirport.FROM_AIRPORT);
}

export async function handleDeleteTrip(req: express.Request,
                                res: express.Response,
                                authToken: security.AuthToken,
                                tripType: db.AddToCampusOrAirport
                               ): Promise<void> {
    const obj: any = req.body;
    if (!obj || !obj.tripId) {
        badRequest(res, 'missing fields');
        return;
    }

    let tripId: ObjectIdTs;
    try {
        tripId = mongoose.Types.ObjectId(obj.tripId);
    } catch (e) {
        console.trace('failed to convert to mongo object ID', obj.tripId);
        badRequest(res, 'bad trip ID');
        return;
    }

    try {
        const success = db.deleteTrip(tripId, authToken.email, tripType);
        if (!success) {
            internalError(res, 'could not delete trip');
        } else {
            successResponse(res);
        }
    } catch (e) {
        console.trace('failed to delete trip', tripType, e);
        internalError(res, 'exception while deleting trip');
    }
}

async function handleJoinTrip(req: express.Request,
                              res: express.Response,
                              authToken: security.AuthToken,
                              tripType: db.AddToCampusOrAirport
                             ): Promise<void> {
    const obj: any = req.body;
    if (!obj || !obj.tripId) {
        badRequest(res, 'missing fields');
        return;
    }

    let tripId: ObjectIdTs;
    try {
        tripId = mongoose.Types.ObjectId(obj.tripId);
    } catch (e) {
        console.trace('failed to convert to mongo object ID', obj.tripId);
        badRequest(res, 'bad trip ID');
        return;
    }

    try {
        const result: DatabaseResult<boolean> = await db.addUserToTrip(tripId, authToken.email, tripType);
        result.caseOf({
            left: e => {
                switch (e) {
                    case db.DatabaseErrorMessage.TRIP_FULL:
                        badRequest(res, 'trip full');
                        break;
                    case db.DatabaseErrorMessage.TRIP_NOT_FOUND:
                        badRequest(res, 'unknown trip');
                        break;
                    default:
                        console.trace('considered internal error:', e);
                        internalError(res);
                        break;
                }
            },
            right: success => {
                if (success) {
                    successResponse(res);
                } else {
                    console.trace('unexpected error');
                    utils.internalError(res);
                }
            }
        });
    } catch (e) {
        console.trace('exception saving user', e);
        utils.internalError(res);
    }
}
