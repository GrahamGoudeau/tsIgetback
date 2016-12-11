import * as mongoose from 'mongoose';
import { NotEmpty, IsInt, IsDate } from "validator.ts/decorator/Validation";
import { Escape } from "validator.ts/decorator/Sanitization";

export type ObjectIdTs = mongoose.Types.ObjectId;
export const ObjectIdSchema = mongoose.Schema.Types.ObjectId;

export class Trip {
    @IsInt({min: 0})
    maxOtherMembers: Number;

    @IsDate()
    tripDate: Date;

    @IsInt({min: 0, max: 23})
    tripHour: Number;

    @IsInt({min: 0, max: 45})
    tripQuarterHour: Number;

    @Escape()
    @NotEmpty()
    tripName: string;

    @Escape()
    @NotEmpty()
    college: string;

    @Escape()
    @NotEmpty()
    airport: string;
}

export interface ITrip extends Trip {
    ownerEmail: string;
    maxOtherMembers: Number;
    tripMemberEmails: string[];
    tripDate: Date;
    tripHour: Number;
    tripQuarterHour: Number;
    tripName: string;
    college: string;
    airport: string
}

export interface ITripModel extends ITrip, mongoose.Document{};
const tripSchema = new mongoose.Schema({
    ownerEmail: String,
    maxOtherMembers: Number,
    tripMemberEmails: [String],
    tripDate: Date,
    tripHour: Number,
    tripQuarterHour: Number,
    tripName: String,
    college: String,
    airport: String
});

export const FromAirport = mongoose.model<ITripModel>("fromAirport", tripSchema, "fromAirport");
export const FromCampus = mongoose.model<ITripModel>("fromCampus", tripSchema, "fromCampus");

export interface IUserVerificationRecord {
    email: string,
    expirationDate: Date
}

export interface IUserVerificationRecordModel extends IUserVerificationRecord, mongoose.Document{};
const UserVerificationRecordSchema = new mongoose.Schema({
    email: String,
    expirationDate: Date
});

export const UserVerificationRecord = mongoose.model<IUserVerificationRecordModel>("UserVerificationRecord", UserVerificationRecordSchema, "userVerificationRecord");

export interface IUser {
    firstName: string,
    lastName: string,
    dateCreated: Date,
    lastLogin: Date,
    passwordHash: string,
    email: string,
    verified: boolean,
    ownedTripsFromCampus: ObjectIdTs[],
    ownedTripsFromAirport: ObjectIdTs[],
    memberTripsFromCampus: ObjectIdTs[],
    memberTripsFromAirport: ObjectIdTs[]
}

export interface IUserModel extends IUser, mongoose.Document{};

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    dateCreated: Date,
    lastLogin: Date,
    passwordHash: String,
    email: String,
    verified: Boolean,
    ownedTripsFromCampus: [ObjectIdSchema],
    ownedTripsFromAirport: [ObjectIdSchema],
    memberTripsFromCampus: [ObjectIdSchema],
    memberTripsFromAirport: [ObjectIdSchema]
});

export const User = mongoose.model<IUserModel>("user", userSchema, "users");

