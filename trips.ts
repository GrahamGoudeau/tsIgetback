import * as tsmonad from 'tsmonad';
import * as db from './db';
import * as utils from './utils';
import * as models from './models';
import * as express from 'express';
import * as security from './security';
import * as mongoose from 'mongoose';

type DatabaseResult<T> = db.DatabaseResult<T>;
type ITrip = models.ITrip;

async function handleTripCreate(req: express.Request,
                                res: express.Response,
                                authToken: security.AuthToken,
                                cont: (query: db.CreateTripQuery) => Promise<DatabaseResult<models.ITrip>>
                               ): Promise<models.ITripModel> {
    /* TODO: security validation
    const validateTrip: (any) => tsmonad.Maybe<db.CreateTripQuery> = (obj) => {
        const dateRegex = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/;
        return obj.maxOtherMembers &&
            obj.tripDate &&
            obj.tripHour &&
            obj.tripQuarterHour &&
            obj.tripName &&
            obj.college &&
            obj.airport &&
            dateRegex.test(obj.tripDate) &&
            (typeof obj.tripHour === 'number') &&
            (typeof obj.


    };
    */
    if (!req.body) {
        utils.badRequest(res);
        return;
    }
    const obj: any = req.body;

    if (obj.maxOtherMembers &&
            obj.tripDate &&
            obj.tripHour &&
            obj.tripQuarterHour &&
            obj.tripName &&
            obj.college &&
            obj.airport) {
        obj.ownerEmail = authToken.email;
        const query: db.CreateTripQuery = obj;
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
    } else {
        utils.badRequest(res, 'missing trip creation fields');
        return;
    }
}

export async function handleFromCampusCreate(req: express.Request, res: express.Response, authToken: security.AuthToken): Promise<void> {
    let createdTrip: models.ITripModel;
    try {
        createdTrip = await handleTripCreate(req, res, authToken, db.createTripFromCampus);
    } catch (e) {
        console.trace('exception while creating trip from campus', e);
        utils.badRequest(res);
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
        console.trace('exception while creating trip from campus', e);
        utils.badRequest(res);
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
