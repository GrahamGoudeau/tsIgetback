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

export const linesToSet: (path: string) => Immutable.Set<string> =
    o(Immutable.Set, readLines);
