import * as models from '../api/models';
import * as test_utils from './test_utils';
import { makeString, makeEndpoint } from './test_utils';
import { IGetBackResponse } from '../api/utils';
import * as WebRequest from 'web-request';
/*
import { AuthToken } from '../api/security';
import * as WebRequest from 'web-request';
*/

describe('The trip endpoints', () => {
    let globalUser: models.IUser;
    let globalPassword: string;
    let reqOpts;
    beforeAll( async (done) => {
        globalPassword = makeString(20);
        try {
            globalUser = await test_utils.createUser(globalPassword);
            const token = await test_utils.login(globalUser.email, globalPassword);
            reqOpts = reqOpts || {};
            reqOpts['headers'] = {
                'Cookie': `IgetbackAuth=${token}`
            };
            done();
        } catch (e) {
            console.trace('Failed trips before all:', e);
            fail();
        }
    });

    async function createValidTrip(fromDestination: 'fromCampus' | 'fromAirport', options: any): Promise<IGetBackResponse> {
        return await createTrip(fromDestination, {
            tripName: makeString(20),
            tripDate: new Date(),
            maxOtherMembers: 3,
            tripHour: 12,
            tripQuarterHour: 45,
            college: 'Tufts University',
            airport: 'Boston,MA|BOS'
        }, options);
    }

    async function createTrip(fromDestination: 'fromCampus' | 'fromAirport', body: any, options: any): Promise<IGetBackResponse> {
        return await WebRequest.json<IGetBackResponse>(
            makeEndpoint(`${fromDestination}/create`),
            Object.assign({}, {
                method: 'POST',
                json: true,
                body: body
            }, options)
        );
    }

    it('can create both kinds of trips', async (done) => {
        const resFromCampus: IGetBackResponse = await createTrip('fromCampus', {
            tripName: makeString(20),
            tripDate: new Date(),
            maxOtherMembers: 3,
            tripHour: 12,
            tripQuarterHour: 45,
            college: 'Tufts University',
            airport: 'Boston,MA|BOS'
        }, reqOpts);
        const resFromAirport: IGetBackResponse = await createTrip('fromCampus', {
            tripName: makeString(20),
            tripDate: new Date(),
            maxOtherMembers: 3,
            tripHour: 12,
            tripQuarterHour: 45,
            college: 'Tufts University',
            airport: 'Boston,MA|BOS'
        }, reqOpts);

        expect(resFromCampus.error == null).toBe(true);
        expect(resFromCampus.data.tripMemberEmails.length).toBe(0);
        expect(resFromAirport.error == null).toBe(true);
        expect(resFromAirport.data.tripMemberEmails.length).toBe(0);
        done();
    });

    it('can delete both kinds of trips', async (done) => {
        const resFromCampus = await createValidTrip('fromCampus', reqOpts);
        const userFromCampusBeforeDelete: models.IUser = await test_utils.getUser(reqOpts);

        expect(userFromCampusBeforeDelete.ownedTripsFromCampus.indexOf(resFromCampus.data._id)).not.toBe(-1);
        const delResCampus = await WebRequest.json<IGetBackResponse>(
            makeEndpoint('fromCampus/delete'),
            Object.assign({}, {
                method: 'DELETE',
                json: true,
                body: {
                    tripId: resFromCampus.data._id
                }
            }, reqOpts)
        );
        const resFromAirport = await createValidTrip('fromAirport', reqOpts);
        const delResAirport = await WebRequest.json<IGetBackResponse>(
            makeEndpoint('fromAirport/delete'),
            Object.assign({}, {
                method: 'DELETE',
                json: true,
                body: {
                    tripId: resFromAirport.data._id
                }
            }, reqOpts)
        );

        // undefined if everything went okay
        expect(delResCampus).toBe(undefined);
        expect(delResAirport).toBe(undefined);

        const userFromCampusAfterDelete: models.IUser = await test_utils.getUser(reqOpts);
        expect(userFromCampusAfterDelete.ownedTripsFromCampus.indexOf(resFromCampus.data._id)).toBe(-1);
        done();
    });
});
