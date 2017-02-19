import * as Immutable from 'immutable';
import { linesToSet } from './functionalUtils';

export class DestinationContext {
    private static INSTANCE: DestinationContext = null;
    private airportCodes: Immutable.Set<string>;
    private colleges: Immutable.Set<string>;
    public static getInstance() {
        if (DestinationContext.INSTANCE == null) {
            DestinationContext.INSTANCE = new DestinationContext();
        }
        return DestinationContext.INSTANCE;
    }

    private constructor() {
        this.airportCodes = linesToSet(`${__dirname}/../data/airport-codes.dat`);
        this.colleges = linesToSet(`${__dirname}/../data/colleges.dat`);
    }

    public getAirportCodes(): Immutable.Set<string> {
        return this.airportCodes;
    }

    public getColleges(): Immutable.Set<string> {
        return this.colleges;
    }
}
