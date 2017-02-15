import * as React from 'react';
import { Component } from './Component';
import { newObject } from '../utils/onClickUtils';

export interface ErrorState<S> {
    field: keyof S;
    condition: (state: S) => boolean; // true if an error happened
}

export abstract class FormComponent<P, S> extends Component<P, S> {
    constructor(props: P) {
        super(props);
    }

    async errorCheck(originalState: S, errorStates: ErrorState<S>[]): Promise<boolean> {
        let error = false;
        const newState: S = newObject(
            originalState,
            errorStates.reduce((stateAcc: S, e: ErrorState<S>) => {
                const currResult: boolean = e.condition(stateAcc);
                error = error || currResult;

                // breaks typechecking
                return newObject(stateAcc, {
                    [e.field]: currResult
                });
            }, originalState)
        );

        await this.setState(newState);
        return error;
    }

    // listen for ENTER key and call this.handleSubmit with the event
    handleKeyUp(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.handleSubmit(event);
        }
    }

    handleSubmit(event: Event) {}

    // update the state's key with the same ID as the input element it came from
    handleChange(event: Event) {
        event.preventDefault();
        const newStateField: any = {};
        const id: string = (event.target as HTMLElement).id as string;
        const value: string = (event.target as HTMLInputElement).value as string;
        this.setState(Object.assign({},
            this.state,
            {
                [id]: value
            }
        ));
    }
}
