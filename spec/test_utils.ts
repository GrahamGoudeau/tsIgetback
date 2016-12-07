import * as WebRequest from 'web-request';
import * as models from '../api/models';
import { AuthToken } from '../api/security';
import { IGetBackResponse } from '../api/utils';

const portNumber = process.env.PORT || 5000;
const rootUrl = `http://localhost:${portNumber}`;

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
        makeEndpoint('user/create'),
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
    return newUserResponse.data;
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
        throw new Error('could not log in');
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
