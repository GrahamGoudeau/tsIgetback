import * as React from 'react';
import { browserHistory } from 'react-router';
import { AuthState } from '../utils/authState';
import { showOrHide, updateState } from '../utils/onClickUtils';

import { ErrorComponent } from './Error';
import { FormComponent } from './Form';

interface InputState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirm: string;
    passwordLength: boolean;
    passwordMatch: boolean;
    emailError: boolean;
}

interface ErrorState<K extends keyof InputState> {
    field: K;
    condition: (state: InputState) => boolean; // true indicates error happened
}

export class Register extends FormComponent<{}, InputState> {
    private readonly SUBMIT_ENDPOINT: string = 'api/user';
    constructor(props: {}) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            passwordConfirm: '',
            passwordLength: false,
            passwordMatch: false,
            emailError: false
        };
    }

    private readonly errorStates: ErrorState<keyof InputState>[] = [{
        field: 'passwordLength',
        condition: (state: InputState) => state.password.length < 6
    }, {
        field: 'passwordMatch',
        condition: (state: InputState) => state.password !== state.passwordConfirm
    }];

    async handleSubmit(event: Event) {
        event.preventDefault();
        if (this.errorCheck(this.state, this.errorStates)) {
            return;
        }

        try {
            const response = await $.ajax({
                url: this.SUBMIT_ENDPOINT,
                method: 'post',
                dataType: 'json',
                data: {
                    firstName: this.state.firstName,
                    lastName: this.state.lastName,
                    email: this.state.email,
                    password: this.state.password
                }
            });
            browserHistory.push('/signIn');
        } catch (e) {
            console.log('err', e);
        }
    }

    render() {
        return (
            <form onKeyUp={this.handleKeyUp.bind(this)} onSubmit={this.handleSubmit.bind(this)}>
                <div>
                    <label>
                        First Name:
                        <input id="firstName" type="text" value={this.state.firstName} onChange={this.handleChange.bind(this)}/>
                    </label>
                </div>
                <div>
                    <label>
                        Last Name:
                        <input id="lastName" type="text" value={this.state.lastName} onChange={this.handleChange.bind(this)}/>
                    </label>
                </div>
                <div>
                    <label>
                        Email:
                        <input id="email" type="text" value={this.state.email} onChange={this.handleChange.bind(this)}/>
                    </label>
                </div>
                <div>
                    <label>
                        Password:
                        <input id="password" type="password" value={this.state.password} onChange={this.handleChange.bind(this)}/>
                        <ErrorComponent doShow={this.state.passwordLength} message='Password not long enough!'/>
                    </label>
                </div>
                <div>
                    <label>
                        Confirm password:
                        <input id="passwordConfirm" type="password" value={this.state.passwordConfirm} onChange={this.handleChange.bind(this)}/>
                        <ErrorComponent doShow={this.state.passwordMatch} message='Passwords do not match!'/>
                    </label>
                </div>
                <input type="button" onClick={this.handleSubmit.bind(this)}/>
            </form>
        );
    }
}
