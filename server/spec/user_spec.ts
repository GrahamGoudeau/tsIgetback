import * as models from '../api/models';
import { IGetBackResponse, AuthToken } from '../utils/requestUtils';
import * as test_utils from './test_utils';
import * as WebRequest from 'web-request';

describe('A user', () => {
    let firstName: string;
    let lastName: string;
    let userEmail: string;
    let userPassword: string;
    let userIds: models.ObjectIdTs[];

    beforeAll( () => {
        firstName = test_utils.makeString(10);
        lastName = test_utils.makeString(10);
        const emailName = test_utils.makeString(16);
        userEmail = `${emailName}@testDomain.com`;
        userPassword = test_utils.makeString(16);
        userIds = [];
    });

    afterAll( async () => {
    });

    it('can reject invalid creation requests', async (done) => {
        const newUserResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
            test_utils.makeEndpoint('user'),
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

    it('should not care about case in email address', async (done) => {
        const password: string = test_utils.makeString(20);
        const newUser: models.IUser = await test_utils.createUser(password);
        try {
            const authToken: AuthToken = await test_utils.login(newUser.email.toUpperCase(), password);
            expect(authToken).not.toBeUndefined();
        } catch (e) {
            fail();
        }
        done();
    });

    it('can be created', async (done) => {
        const newUserResponse: IGetBackResponse = await WebRequest.json<IGetBackResponse>(
            test_utils.makeEndpoint('user'),
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
        expect(newUserResponse.data.newUser.email.toUpperCase()).toBe(userEmail.toUpperCase());
        userIds.push(newUserResponse.data._id);
        done();
    });

    it('cannot log in if not existing', async (done) => {
        try {
            await test_utils.login(test_utils.makeString(40), test_utils.makeString(40));
        } catch (e) {
            done();
        }

        fail();
    });
});
