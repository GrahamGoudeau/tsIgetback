import * as models from './models';
import * as tsmonad from 'tsmonad';
import * as security from './security';
import * as mongoose from 'mongoose';

type IUser = models.IUser;
type Either<L, R> = tsmonad.Either<L, R>;
const Either = tsmonad.Either;

export enum DatabaseErrorMessage {
    USER_EXISTS,
    USER_NOT_FOUND
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

export interface TripsQuery {
    tripIds: models.ObjectIdTs[]
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

async function getTrips(query: TripsQuery, model: mongoose.Model<models.ITripModel>): Promise<models.ITrip[]> {
    return await model.find({
        '_id': {
            '$in': query.tripIds
        }
    });
}

export async function getTripsFromAirport(query: TripsQuery): Promise<models.ITrip[]> {
    return getTrips(query, models.FromAirport);
}

export async function getTripsFromCampus(query: TripsQuery): Promise<models.ITrip[]> {
    return getTrips(query, models.FromCampus);
}
