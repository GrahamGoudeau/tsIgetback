import * as models from './models';
import * as tsmonad from 'tsmonad';
import * as security from './security';
import * as mongoose from 'mongoose';
import { LoggerModule } from './logger';

const log = new LoggerModule('db');

type IUser = models.IUser;
type ObjectIdTs = models.ObjectIdTs;
type Either<L, R> = tsmonad.Either<L, R>;
const Either = tsmonad.Either;

export enum DatabaseErrorMessage {
    USER_EXISTS,
    NOT_FOUND,
    DB_ERROR,
    TRIP_FULL,
}

export type DatabaseResult<T> = Either<DatabaseErrorMessage, T>

export interface OneUserQuery {
    email: string
}

export interface UserPasswordQuery extends OneUserQuery {
    password: string
}

export interface FindTripsQuery {
    tripIds: models.ObjectIdTs[]
}

export interface CreateTripQuery {
    ownerEmail: string;
    maxOtherMembers: Number;
    tripDate: Date;
    tripHour: Number;
    tripQuarterHour: Number;
    tripName: string;
    college: string;
    airport: string;
}

function hashPassword(email: string, password: string) {
    return security.hashPassword(email, password);
}

export async function createUser(firstName: string, lastName: string, email: string, password: string): Promise<DatabaseResult<IUser>> {
    const userQuery: OneUserQuery = {
        email: email
    };
    const numExistingResult: Number = await models.User.count(userQuery);
    if (numExistingResult != 0) {
        return Either.left(DatabaseErrorMessage.USER_EXISTS);
    }
    const newUserDetails: IUser = {
        firstName: firstName,
        lastName: lastName,
        dateCreated: new Date(),
        lastLogin: null,
        passwordHash: hashPassword(email, password),
        email: email,
        verified: false,
        ownedTripsFromCampus: [],
        ownedTripsFromAirport: [],
        memberTripsFromCampus: [],
        memberTripsFromAirport: []
    };
    const newUser: models.IUserModel = new models.User(newUserDetails);
    return Either.right(await newUser.save());
}

export async function recordLogin(query: OneUserQuery): Promise<void> {
    await models.User.findOneAndUpdate(query, {
        lastLogin: new Date()
    }, { new: true });
}

export async function verifyUser(query: OneUserQuery): Promise<void> {
    await models.User.update(query, {
        $set: {
            verified: true
        }
    });
}

export async function deleteUser(query: OneUserQuery): Promise<void> {
    await models.User.remove(query);
    return;
}

export async function doesUserExist(query: OneUserQuery): Promise<boolean> {
    const numFound: number = await models.User.count(query);
    return numFound !== 0;
}

export async function getUserFromEmail(query: OneUserQuery): Promise<DatabaseResult<IUser>> {
    const existingUser = await models.User.findOne(query);
    if (existingUser == null) {
        return Either.left(DatabaseErrorMessage.NOT_FOUND);
    }

    return Either.right(existingUser);
}

export async function getUserFromEmailAndPassword(query: UserPasswordQuery): Promise<DatabaseResult<IUser>> {
    const dbQuery = {
        email: query.email,
        passwordHash: security.hashPassword(query.email, query.password)
    };
    const user = await models.User.findOne(dbQuery);
    if (user == null) {
        return Either.left(DatabaseErrorMessage.NOT_FOUND);
    }

    return Either.right(user);
}

async function getTrips(query: FindTripsQuery, model: mongoose.Model<models.ITripModel>): Promise<models.ITrip[]> {
    return await model.find({
        '_id': {
            '$in': query.tripIds
        }
    });
}

async function createTrip(query: CreateTripQuery, model: mongoose.Model<models.ITripModel>): Promise<DatabaseResult<models.ITrip>> {
    try {
        const newTrip: models.ITripModel = new model(query);
        const t = await newTrip.save();
        return Either.right(t);
    } catch (e) {
        log.ERROR('exception creating trip', e.name, e.message);
        throw e;
    }
}

export async function createTripFromCampus(query: CreateTripQuery): Promise<DatabaseResult<models.ITrip>> {
    return createTrip(query, models.FromCampus);
}

export async function createTripFromAirport(query: CreateTripQuery): Promise<DatabaseResult<models.ITrip>> {
    return createTrip(query, models.FromAirport);
}

export async function getTripsFromCampus(query: FindTripsQuery): Promise<models.ITrip[]> {
    return getTrips(query, models.FromCampus);
}

export async function getTripsFromAirport(query: FindTripsQuery): Promise<models.ITrip[]> {
    return getTrips(query, models.FromAirport);
}

export enum AddToCampusOrAirport {
    FROM_CAMPUS,
    FROM_AIRPORT
}

async function addNewTripToUser(id: models.ObjectIdTs, userEmail: string, tripKind: AddToCampusOrAirport): Promise<void> {
    const updateObj = {
        '$push': {}
    };
    updateObj['$push'][tripKind === AddToCampusOrAirport.FROM_CAMPUS ? 'ownedTripsFromCampus' : 'ownedTripsFromAirport'] = id;
    const searchObj = {
        email: userEmail
    };

    // TODO: what happens if the email is not found?
    const result = await models.User.findOneAndUpdate(searchObj, updateObj, {new: true});

    if (result == null) {
        throw new Error('Could not find trip');
    }
}

export async function addNewTripFromCampusToUser(id: models.ObjectIdTs, userEmail: string): Promise<void> {
    return addNewTripToUser(id, userEmail, AddToCampusOrAirport.FROM_CAMPUS);
}

export async function addNewTripFromAirportToUser(id: models.ObjectIdTs, userEmail: string): Promise<void> {
    return addNewTripToUser(id, userEmail, AddToCampusOrAirport.FROM_AIRPORT);
}

export async function addUserToTrip(tripId: ObjectIdTs, emailToAdd: string, tripType: AddToCampusOrAirport): Promise<DatabaseResult<boolean>> {
    const updateObj = {
        '$push': {}
    };
    updateObj['$push']['tripMemberEmails'] = emailToAdd;
    const searchObj = {
        _id: tripId
    };

    const model: mongoose.Model<models.ITripModel> = tripType === AddToCampusOrAirport.FROM_CAMPUS ? models.FromCampus : models.FromAirport;
    try {
        const tripStats = await model.findOne(searchObj, 'maxOtherMembers tripMemberEmails');
        if (tripStats == null) {
            return Either.left(DatabaseErrorMessage.NOT_FOUND);
        } else if (tripStats.tripMemberEmails.length + 1 > tripStats.maxOtherMembers) {
            return Either.left(DatabaseErrorMessage.TRIP_FULL);
        }

        await model.findOneAndUpdate(searchObj, updateObj, { new: true });
        return Either.right(true);
    } catch (e) {
        log.ERROR('exception saving user to trip:', e.message);
        return Either.left(DatabaseErrorMessage.DB_ERROR);
    }
}

export async function createVerificationRecord(email: string): Promise<ObjectIdTs> {
    const expirationDate: Date = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1);

    const record: models.IUserVerificationRecordModel = await models.UserVerificationRecord.create({
        email: email
    });
    return record._id;
}

export async function getVerificationRecord(id: string): Promise<DatabaseResult<models.IUserVerificationRecord>> {
    let recordId: ObjectIdTs;
    try {
        recordId = mongoose.Types.ObjectId(id);
    } catch (e) {
        log.DEBUG('Got exception:', e.message);
        return Either.left(DatabaseErrorMessage.DB_ERROR);
    }

    const rec: models.IUserVerificationRecordModel = await models.UserVerificationRecord.findOne({ _id: recordId});
    if (rec == null) {
        return Either.left(DatabaseErrorMessage.NOT_FOUND);
    }

    return Either.right(rec);
}

export async function deleteTrip(tripId: ObjectIdTs, ownerEmail: string, tripType: AddToCampusOrAirport): Promise<DatabaseResult<boolean>> {
    const isCampus = tripType === AddToCampusOrAirport.FROM_CAMPUS;
    let model: mongoose.Model<models.ITripModel>;
    let ownedField: string;
    let memberField: string;
    if (isCampus) {
        model = models.FromCampus;
        ownedField = 'ownedTripsFromCampus';
        memberField = 'memberTripsFromCampus';
    } else {
        model = models.FromAirport;
        ownedField = 'ownedTripsFromAirport';
        memberField = 'memberTripsFromAirport';
    }

    const query = { _id: tripId, ownerEmail: ownerEmail };
    const tripExists: boolean = (await model.count(query)) != 0;
    if (!tripExists) {
        return Either.left(DatabaseErrorMessage.NOT_FOUND);
    }

    const pullObj = { $pullAll: {}};
    pullObj.$pullAll[ownedField] = [tripId];
    pullObj.$pullAll[memberField] = [tripId];
    await models.User.update({}, pullObj, { multi: true });
    const result = model.remove(query);
    return Either.right(result != null);
}
