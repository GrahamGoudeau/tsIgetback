import * as models from '../models';
import * as WebRequest from 'web-request';
import { AuthToken } from '../security';
import { IGetBackResponse } from '../utils';

const portNumber = process.env.PORT || 5000;
const rootUrl = `http://localhost:${portNumber}`;
let currentTestId = 0;

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

export async function login(email: string, password: string): Promise<AuthToken> {
    try {
        const loginResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
            makeEndpoint('login'),
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
