import * as fs from 'fs';

export function o<A, B, C>(f: (y: B) => C,
                           g: (x: A) => B): (z: A) => C {
    return x => f(g(x));
}

export const dateRegex: RegExp = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{1,4}$/;

export function readLines(filePath: string): string[] {
    return fs.readFileSync(filePath).toString().split('\n');
};

export type ComparatorReturnValue = 0 | 1 | -1;

// if x < y, comp(x, y) === -1
// if x > y, comp(x, y) === 1
// x === y, comp(x, y) === 0
export function binaryContains<T>(array: T[], value: T, comparator?: (x: T, y: T) => ComparatorReturnValue): boolean {
    function defaultComparator(x: T, y: T): ComparatorReturnValue {
        if (x < y) return -1;
        else if (x > y) return 1;
        else return 0;
    }
    const comp: (x: T, y: T) => ComparatorReturnValue = comparator || defaultComparator;

    const len: number = array.length;
    if (len === 0) {
        return false;
    }

    let upper: number = len - 1;
    let lower: number = 0;
    let midpoint: number = Math.floor((upper + lower) / 2);
    while (lower < upper) {
        if (comp(array[midpoint], value) === -1) {
            lower = midpoint + 1;
        } else if (comp(array[midpoint], value) === 1) {
            upper = midpoint - 1;
        } else {
            return true;
        }
        midpoint = Math.floor((upper + lower) / 2);
    }
    return array[midpoint] === value;
}
