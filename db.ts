import * as models from './models';
import * as tsmonad from 'tsmonad';
import * as security from './security';
import * as mongoose from 'mongoose';

type IUser = models.IUser;

export enum DatabaseErrorMessages {
    USER_EXISTS,
    USER_NOT_FOUND
}

export class DatabaseError extends Error {
    constructor(public message: string, public errorValue: DatabaseErrorMessages) {
        super(message);
    }

    static userExists() {
        return new DatabaseError('user exists', DatabaseErrorMessages.USER_EXISTS);
    }

    static userNotFound() {
        return new DatabaseError('user not found', DatabaseErrorMessages.USER_NOT_FOUND);
    }
}

export type DbResult<T> = tsmonad.Either<DatabaseError, T>

export interface OneUserQuery {
    email: string
}

export interface UserPasswordQuery extends OneUserQuery {
    password: string
}

function hashPassword(email: string, password: string) {
    return security.hashPassword(email, password);
}

export async function createUser(firstName: string, lastName: string, email: string, password: string): Promise<IUser> {
    const userQuery: OneUserQuery = {
        email: email
    };
    const numExistingResult: Number = await models.User.count(userQuery);
    if (numExistingResult != 0) {
        throw DatabaseError.userExists();
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
    return await newUser.save();
}

async function getUserFromQuery(query: OneUserQuery): Promise<models.IUser> {
    const existingUser = await models.User.findOne(query);
    if (existingUser == null) {
        throw DatabaseError.userNotFound();
    }

    return existingUser;
}

export async function getUser(query: OneUserQuery): Promise<models.IUser> {
    return getUserFromQuery(query);
}
