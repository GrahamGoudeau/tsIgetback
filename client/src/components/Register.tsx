import * as React from 'react';
import { browserHistory } from 'react-router';
import { AuthState } from '../utils/authState';
import { showOrHide, updateState } from '../utils/onClickUtils';

import { ErrorComponent } from './Error';

interface InputState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirm: string;
    passwordError: boolean;
    emailError: boolean;
}

export class Register extends React.Component<{}, InputState> {
    private readonly SUBMIT_ENDPOINT: string = 'api/user';
    constructor(props: InputState) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            passwordConfirm: '',
            passwordError: false,
            emailError: false
        };
    }

    async handleSubmit(event: Event) {
        if (this.state.password.length < 6) {
            this.setState(updateState(this.state, 'passwordError', true));
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
            const authState: AuthState = AuthState.getInstance();
            authState.authorize({
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                email: this.state.email
            });
            browserHistory.push('/');
        } catch (e) {
            console.log('err', e);
        }
        event.preventDefault();
    }

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

    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
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
                        <ErrorComponent doShow={this.state.passwordError} message='Password not long enough!'/>
                    </label>
                </div>
                <div>
                    <label>
                        Confirm password:
                        <input id="passwordConfirm" type="password" value={this.state.passwordConfirm} onChange={this.handleChange.bind(this)}/>
                    </label>
                </div>
                <input type="button" onClick={this.handleSubmit.bind(this)}/>
            </form>
        );
    }
}
