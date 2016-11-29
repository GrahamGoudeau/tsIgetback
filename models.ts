import * as mongoose from 'mongoose';

export type ObjectIdTs = mongoose.Types.ObjectId;
export const ObjectIdSchema = mongoose.Schema.Types.ObjectId;

export interface ITrip {
    ownerEmail: string;
    maxOtherMembers: Number;
    tripMemberIds: ObjectIdTs[];
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
    tripMemberIds: [ObjectIdSchema],
    tripDate: Date,
    tripHour: Number,
    tripQuarterHour: Number,
    tripName: String,
    college: String,
    airport: String
});

export const FromAirport = mongoose.model<ITripModel>("fromAirport", tripSchema);
export const FromCampus = mongoose.model<ITripModel>("fromCampus", tripSchema);

export interface IUser {
    firstName: string,
    lastName: string,
    dateCreated: Date,
    lastLogin: Date,
    passwordHash: string,
    email: string,
    verified: boolean,
    tripsFromCampus: ObjectIdTs[],
    tripsFromAirport: ObjectIdTs[]
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
    tripsFromCampus: [ObjectIdSchema],
    tripsFromAirport: [ObjectIdSchema]
});

export const User = mongoose.model<IUserModel>("user", userSchema);

