import { IsEmail, NotEmpty, Matches, IsInt, IsDate } from 'validator.ts/decorator/Validation';
import { Escape } from 'validator.ts/decorator/Sanitization';
import { dateRegex, combineObjects } from './functionalUtils';

export abstract class ValidRequest {
};

export function buildValidRequest<R extends ValidRequest>(requestConstructor: new () => R, data: any): R {
    const result: R = new requestConstructor();
    return combineObjects(result, data);
}

export class TripCreateRequest extends ValidRequest {
    @IsInt({min: 0})
    maxOtherMembers: Number;

    @IsDate()
    @Matches(dateRegex)
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

export class UserSubscribeRequest extends ValidRequest {
    @IsDate()
    @Matches(dateRegex)
    tripDate: Date;

    @Escape()
    @NotEmpty()
    airport: string;

    @Escape()
    @NotEmpty()
    college: string;

    @IsInt({min: 0, max: 23})
    tripHour: number;

    @IsInt({min: 0, max: 45})
    tripQuarterHour: number;
}

export class UserCreateRequest extends ValidRequest {
    @Escape()
    @NotEmpty()
    firstName: string;

    @Escape()
    @NotEmpty()
    lastName: string;

    @NotEmpty()
    @IsEmail()
    email: string;

    @NotEmpty()
    password: string;
}

export class UserLoginRequest extends ValidRequest {
    @NotEmpty()
    @IsEmail()
    email: string;

    @NotEmpty()
    password: string;
}
