import * as models from '../models';
import { IGetBackResponse } from '../utils';
import { AuthToken } from '../security';
import * as test_utils from './test_utils';
import * as WebRequest from 'web-request';

describe('A user', () => {
    let firstName: string;
    let lastName: string;
    let userEmail: string;
    let userPassword: string;

    beforeAll( () => {
        firstName = test_utils.makeString(10);
        lastName = test_utils.makeString(10);
        const emailName = test_utils.makeString(16);
        userEmail = `${emailName}@testDomain.com`;
        userPassword = test_utils.makeString(16);
    });

    it('can reject creation requests', async (done) => {
        const newUserResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
            test_utils.makeEndpoint('createUser'),
            {
                method: 'POST',
                json: true,
                body: {
                    firstName: firstName,
                    password: userPassword
                }

            });
        expect(newUserResponse.data == null).toBe(true);
        expect(newUserResponse.error == null).toBe(false);
        done();
    });

    it('can be created', async (done) => {
        const newUserResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
            test_utils.makeEndpoint('createUser'),
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
        expect(newUserResponse.data == null).toBe(false);
        expect(newUserResponse.error == null).toBe(true);
        expect(newUserResponse.data.email).toBe(userEmail);
        done();
    });

    it('can log in if existing', async (done) => {
        const token: AuthToken = await test_utils.login(userEmail, userPassword);
        expect(token == null).toBe(false);
        done();
    });

    it('cannot log in if not existing', async (done) => {
        try {
            const token: AuthToken = await test_utils.login(test_utils.makeString(40), test_utils.makeString(40));
        } catch (e) {
            done();
        }

        fail();
    });
});
