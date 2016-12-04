import * as tsmonad from 'tsmonad';
import * as db from './db';
import * as utils from './utils';
import * as models from './models';
import * as express from 'express';
import * as security from './security';
import * as mongoose from 'mongoose';
import { Validator } from "validator.ts/Validator";

const validator: Validator = new Validator();
type DatabaseResult<T> = db.DatabaseResult<T>;
type ITrip = models.ITrip;

async function handleTripCreate(req: express.Request,
                                res: express.Response,
                                authToken: security.AuthToken,
                                cont: (query: db.CreateTripQuery) => Promise<DatabaseResult<models.ITrip>>
                               ): Promise<models.ITripModel> {
    if (!req.body) {
        utils.badRequest(res);
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
            utils.badRequest(res, 'could not save trip');
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
        utils.badRequest(res, 'failed to create trip');
        return;
    }

    try {
        await db.addNewTripFromCampusToUser(createdTrip._id, authToken.email);
    } catch (e) {
        console.trace('Problem saving to user:', e);
        utils.internalError(res, 'problem saving to user');
        return;
    }
    utils.jsonResponse(res, createdTrip);
}

export async function handleFromAirportCreate(req: express.Request, res: express.Response, authToken: security.AuthToken): Promise<void> {
    let createdTrip: models.ITripModel;
    try {
        createdTrip = await handleTripCreate(req, res, authToken, db.createTripFromAirport);
    } catch (e) {
        console.trace('exception while creating trip from airport', e);
        utils.badRequest(res, 'failed to create trip');
        return;
    }

    try {
        await db.addNewTripFromAirportToUser(createdTrip._id, authToken.email);
    } catch (e) {
        console.trace('Problem saving to user:', e);
        utils.internalError(res, 'problem saving to user');
        return;
    }
    utils.jsonResponse(res, createdTrip);
}
