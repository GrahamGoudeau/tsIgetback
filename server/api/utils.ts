import * as fs from 'fs';
import * as Immutable from 'immutable';

export function o<A, B, C>(f: (y: B) => C,
                           g: (x: A) => B): (z: A) => C {
    return x => f(g(x));
}

export const dateRegex: RegExp = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{1,4}$/;

export function readLines(filePath: string): string[] {
    return fs.readFileSync(filePath).toString().split('\n');
};

const linesToSet: (path: string) => Immutable.Set<string> =
    o(Immutable.Set, readLines);

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
