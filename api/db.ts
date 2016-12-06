import * as models from './models';
import * as tsmonad from 'tsmonad';
import * as security from './security';
import * as mongoose from 'mongoose';

type IUser = models.IUser;
type ObjectIdTs = models.ObjectIdTs;
type Either<L, R> = tsmonad.Either<L, R>;
const Either = tsmonad.Either;

export enum DatabaseErrorMessage {
    USER_EXISTS,
    USER_NOT_FOUND,
    DB_ERROR,
    TRIP_FULL,
    TRIP_NOT_FOUND
}

export type DatabaseResult<T> = Either<DatabaseErrorMessage, T>

export class DatabaseError extends Error {
    constructor(public message: string, public errorValue: DatabaseErrorMessage) {
        super(message);
    }

    static userExists(): DatabaseError {
        return new DatabaseError('user exists', DatabaseErrorMessage.USER_EXISTS);
    }

    static userNotFound(): DatabaseError {
        return new DatabaseError('user not found', DatabaseErrorMessage.USER_NOT_FOUND);
    }
}

export type DbResult<T> = Either<DatabaseError, T>

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
        tripsFromCampus: [],
        tripsFromAirport: []
    };
    const newUser: models.IUserModel = new models.User(newUserDetails);
    return Either.right(await newUser.save());
}

export async function recordLogin(query: OneUserQuery): Promise<void> {
    await models.User.findOneAndUpdate(query, {
        lastLogin: new Date()
    }, { new: true });
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
        return Either.left(DatabaseErrorMessage.USER_NOT_FOUND);
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
        return Either.left(DatabaseErrorMessage.USER_NOT_FOUND);
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
        console.trace('exception creating trip:', e);
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
    updateObj['$push'][tripKind === AddToCampusOrAirport.FROM_CAMPUS ? 'tripsFromCampus' : 'tripsFromAirport'] = id;
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
            return Either.left(DatabaseErrorMessage.TRIP_NOT_FOUND);
        } else if (tripStats.tripMemberEmails.length + 1 > tripStats.maxOtherMembers) {
            return Either.left(DatabaseErrorMessage.TRIP_FULL);
        }

        await model.findOneAndUpdate(searchObj, updateObj, { new: true });
        return Either.right(true);
    } catch (e) {
        console.trace('exception saving user to trip:', e);
        return Either.left(DatabaseErrorMessage.DB_ERROR);
    }
}
