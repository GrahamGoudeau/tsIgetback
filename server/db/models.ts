import * as mongoose from 'mongoose';

export type ObjectIdTs = mongoose.Types.ObjectId;
export const ObjectIdSchema = mongoose.Schema.Types.ObjectId;

export interface ITrip {
    ownerEmail: string;
    maxOtherMembers: number;
    tripMemberEmails: string[];
    tripDate: Date;
    tripHour: number;
    tripQuarterHour: number;
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

export interface ISubscription {
    email: string;
    airport: string;
    college: string;
    tripDate: Date;
    tripHour: number;
    tripQuarterHour: number;
    dateCreated: Date;
}

export interface ISubscriptionModel extends ISubscription, mongoose.Document{};
const subscriptionSchema = new mongoose.Schema({
    email: String,
    airport: String,
    college: String,
    tripDate: Date,
    tripHour: Number,
    tripQuarterHour: Number,
    dateCreated: Date
});

export const FromAirportSubscription = mongoose.model<ISubscriptionModel>("fromAirportSubscription", subscriptionSchema, "fromAirportSubscription");
export const FromCampusSubscription = mongoose.model<ISubscriptionModel>("fromCampusSubscription", subscriptionSchema, "fromCampusSubscription");

export interface IUserVerificationRecord {
    email: string,
    uuid: string
}

export interface IUserVerificationRecordModel extends IUserVerificationRecord, mongoose.Document{};
const UserVerificationRecordSchema = new mongoose.Schema({
    email: String,
    uuid: String
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

