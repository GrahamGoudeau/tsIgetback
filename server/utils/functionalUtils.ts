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

export function defaults<T>(value: T, other: T): T {
    if (value == null) {
        return other;
    }
    return value;
}

export function getDateString(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export function getAllRegexMatches(input: string, pattern: string): string[] {
    const result: string[] = [];
    let m: RegExpExecArray = null;
    const regex: RegExp = new RegExp(pattern, 'g');
    do {
        m = regex.exec(input);
        console.log('running:', m);
        if (m) {
            result.push(m[1]);
        }
    } while (m);
    return result;
}
