import * as db from './db';
import * as utils from './utils';
import * as models from './models';
import * as express from 'express';

export async function createUser(req: express.Request, res: express.Response): Promise<void> {
    const obj: any = req.body;
    if (!obj) {
        utils.badRequest(res);
    }

    if (obj.firstName && obj.lastName && obj.email && obj.password) {
        const newUser = await db.createUser(obj.firstName,
                                            obj.lastName,
                                            obj.email,
                                            obj.password);
        console.log(newUser);
        res.send(newUser);
    } else {
        utils.badRequest(res, 'missing fields');
    }
}
