import { isProduction } from './utils';
import * as path from 'path';
import * as fs from 'fs';

const templateDir: string = `${__dirname}/../data/templates/`;
export const templates = {
    'userVerification': `${templateDir}/userVerification.html`
}

function readFile(path: string): Promise<number> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data: Buffer) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
}

export async function userVerification() {
    console.log(await readFile(templates.userVerification));
    console.log(path.resolve(templates.userVerification));
}
