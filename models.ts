import * as mongoose from 'mongoose';

type ObjectIdTs = mongoose.Types.ObjectId;
const ObjectIdSchema = mongoose.Schema.Types.ObjectId;

interface ITrip {
    ownerEmail: String,
    maxOtherMembers: Number,
    tripMemberIds: ObjectIdTs[],
    tripDate: Date,
    tripHour: Number,
    tripQuarterHour: Number,
    tripName: String,
    college: String,
    airport: String
}

interface ITripModel extends ITrip, mongoose.Document{};
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

interface IUser {
    firstName: String,
    lastName: String,
    dateCreated: Date,
    lastLogin: Date,
    passwordHash: String,
    email: String,
    verified: boolean,
    tripsFromCampus: ObjectIdTs[],
    tripsFromAirport: ObjectIdTs[]
}

interface IUserModel extends IUser, mongoose.Document{};
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

