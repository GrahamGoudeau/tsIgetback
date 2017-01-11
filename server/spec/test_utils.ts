import * as WebRequest from 'web-request';
import * as models from '../api/models';
import { IGetBackConfig } from '../config';
import { AuthToken, IGetBackResponse } from '../utils/requestUtils';
import { getDateString } from '../utils/functionalUtils';


const config: IGetBackConfig = IGetBackConfig.getInstance();
const portNumber = config.getNumberConfig('PORT');
const rootUrl = `http://localhost:${portNumber}`;
export const airport: string = 'Boston, MA|BOS';
export const college: string = 'Tufts University';

export function makeEndpoint(endpoint: string): string {
    return `${rootUrl}/api/${endpoint}/`;
}

export function makeString(length: number)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

export async function createUser(userPassword: string): Promise<models.IUser> {
    const firstName = makeString(20);
    const lastName = makeString(20);
    const emailName = makeString(16);
    const userEmail = `${emailName}@testDomain.com`;
    const newUserResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
        makeEndpoint('user'),
        {
            method: 'POST',
            json: true,
            body: {
                firstName: firstName,
                lastName: lastName,
                email: userEmail,
                password: userPassword
            }
        });
    return newUserResponse.data.newUser;
}

export async function login(email: string, password: string): Promise<AuthToken> {
    try {
        const loginResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
            makeEndpoint('user/login'),
            {
                method: 'POST',
                json: true,
                body: {
                    email: email,
                    password: password
                }
            });
        return loginResponse.data.authToken;
    } catch (e) {
        throw new Error('could not log in - make sure that email is disabled?');
    }
}

export async function getUser(options: any): Promise<models.IUser> {
    const userResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
        makeEndpoint('user/account'),
        Object.assign({}, {
            method: 'GET'
        }, options)
    );
    return userResponse.data;
}

export function randomDate(): Date {
    const start: Date = new Date(0);
    const end: Date = new Date('05/21/2017');
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function randDateStr(): string {
    return getDateString(randomDate());
}
