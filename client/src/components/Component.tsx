import * as React from 'react';
import { newObject } from '../utils/onClickUtils';

export abstract class Component<P, S> extends React.Component<P, S> {
    async setStateAsync(newState: S): Promise<any> {
        return new Promise((resolve, reject) => {
            this.setState(newState, () => {
                resolve();
            });
        });
    }

    updateState(key: keyof S, value: S[keyof S]) {
        const update: any = {};
        update[key] = value;
        this.setState(newObject(this.state, update));
    }

    async updateStateAsync(key: keyof S, value: S[keyof S]) {
        const update: any = {};
        update[key] = value;
        await this.setStateAsync(newObject(this.state, update));
    }
}
