import * as models from '../api/models';
import * as test_utils from './test_utils';
import { makeString, makeEndpoint } from './test_utils';
import { IGetBackResponse } from '../utils/requestUtils';
import * as WebRequest from 'web-request';
import { getDateString } from '../utils/functionalUtils';

describe('The trip endpoints', () => {
    let globalUser1: models.IUser;
    let globalPassword1: string;
    let reqOpts1;
    let globalUser2: models.IUser;
    let globalPassword2: string;
    let reqOpts2;
    beforeAll( async (done) => {
        globalPassword1 = makeString(20);
        globalPassword2 = makeString(20);
        try {
            globalUser1 = await test_utils.createUser(globalPassword1);
            globalUser2 = await test_utils.createUser(globalPassword2);
            const token1 = await test_utils.login(globalUser1.email, globalPassword1);
            const token2 = await test_utils.login(globalUser2.email, globalPassword2);
            reqOpts1 = reqOpts1 || {};
            reqOpts1['headers'] = {
                'Cookie': `IgetbackAuth=${token1}`
            };
            reqOpts2 = reqOpts2 || {};
            reqOpts2['headers'] = {
                'Cookie': `IgetbackAuth=${token2}`
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
            tripDate: test_utils.randDateStr(),
            maxOtherMembers: 3,
            tripHour: 12,
            tripQuarterHour: 45,
            college: test_utils.college,
            airport: test_utils.airport
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
            tripDate: test_utils.randDateStr(),
            maxOtherMembers: 3,
            tripHour: 12,
            tripQuarterHour: 45,
            college: test_utils.college,
            airport: test_utils.airport
        }, reqOpts1);
        const resFromAirport: IGetBackResponse = await createTrip('fromCampus', {
            tripName: makeString(20),
            tripDate: test_utils.randDateStr(),
            maxOtherMembers: 3,
            tripHour: 12,
            tripQuarterHour: 45,
            college: test_utils.college,
            airport: test_utils.airport
        }, reqOpts1);

        expect(resFromCampus.error == null).toBe(true);
        expect(resFromCampus.data.tripMemberEmails.length).toBe(0);
        expect(resFromAirport.error == null).toBe(true);
        expect(resFromAirport.data.tripMemberEmails.length).toBe(0);
        done();
    });

    it('can delete both kinds of trips', async (done) => {
        const resFromCampus = await createValidTrip('fromCampus', reqOpts1);
        const userFromCampusBeforeDelete: models.IUser = await test_utils.getUser(reqOpts1);

        expect(userFromCampusBeforeDelete.ownedTripsFromCampus.indexOf(resFromCampus.data._id)).not.toBe(-1);
        const delResCampus = await WebRequest.json<IGetBackResponse>(
            makeEndpoint(`fromCampus/delete/${resFromCampus.data._id}`),
            Object.assign({}, {
                method: 'DELETE'
            }, reqOpts1)
        );
        const resFromAirport = await createValidTrip('fromAirport', reqOpts1);
        const delResAirport = await WebRequest.json<IGetBackResponse>(
            makeEndpoint(`fromAirport/delete/${resFromAirport.data._id}`),
            Object.assign({}, {
                method: 'DELETE'
            }, reqOpts1)
        );

        // undefined if everything went okay
        expect(delResCampus).toBe(undefined);
        expect(delResAirport).toBe(undefined);

        const userFromCampusAfterDelete: models.IUser = await test_utils.getUser(reqOpts1);
        expect(userFromCampusAfterDelete.ownedTripsFromCampus.indexOf(resFromCampus.data._id)).toBe(-1);
        done();
    });

    it('cannot delete trips that it does not own', async (done) => {
        const res = await createValidTrip('fromCampus', reqOpts1);
        const userFromCampusBeforeDelete1: models.IUser = await test_utils.getUser(reqOpts1);
        expect(userFromCampusBeforeDelete1.ownedTripsFromCampus.indexOf(res.data._id)).not.toBe(-1);

        try {
            const delRes = await WebRequest.json<IGetBackResponse>(
                makeEndpoint('fromCampus/delete'),
                Object.assign({}, {
                    method: 'DELETE',
                    json: true,
                    body: {
                        tripId: res.data._id
                    }
                }, reqOpts2)
            );
            expect(delRes).not.toBeUndefined();
            const userFromCampusAfterDelete1: models.IUser = await test_utils.getUser(reqOpts1);
            expect(userFromCampusAfterDelete1.ownedTripsFromCampus.indexOf(res.data._id)).not.toBe(-1);
            done();
        } catch (e) {
            console.trace(e);
            fail();
        }
    });

    it('can search and retrieve created trips', async (done) => {
        try {
            const res = await createValidTrip('fromCampus', reqOpts1);
            const searchRes = await WebRequest.json<IGetBackResponse>(
                makeEndpoint('fromCampus/search'),
                Object.assign({}, {
                    method: 'POST',
                    json: true,
                    body: {
                        tripDate: getDateString(new Date(res.data.tripDate)),
                        tripHour: res.data.tripHour,
                        college: res.data.college,
                        airport: res.data.airport
                    }
                }, reqOpts2)
            );
            expect(searchRes.data).not.toBeUndefined();
            expect(searchRes.data.length).toBe(1);
            expect(searchRes.data[0].tripName).toBe(res.data.tripName);
            done();
        } catch (e) {
            console.log(e);
            fail();
        }
    });
});
