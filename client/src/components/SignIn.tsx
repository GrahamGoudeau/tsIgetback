import * as React from 'react';
import { browserHistory } from 'react-router';
import { Button } from 'react-bootstrap';
import { ApplicationState } from '../index';
import { goToUrl } from '../utils/onClickUtils';
import { UserInfo, AuthState } from '../utils/authState';
import { ErrorState, FormComponent } from './Form';
import { ErrorComponent } from './Error';

interface SignInState {
    email: string;
    password: string;
    emailFormat: boolean;
    passwordLength: boolean;
    signInFail: boolean;
}

export class SignIn extends FormComponent<{}, SignInState> {
    private readonly SIGN_IN_ENDPOINT: string = 'api/user/login';
    constructor(props: any) {
        super(props);
        this.state = {
            email: '',
            password: '',
            emailFormat: false,
            passwordLength: false,
            signInFail: false
        };
    }

    private readonly errorStates: ErrorState<SignInState>[] = [{
        field: 'emailFormat',
        condition: (state: SignInState) => state.email.indexOf('@') === -1
    }, {
        field: 'passwordLength',
        condition: (state: SignInState) => state.password.length < 6
    }];

    async handleSubmit(event: Event) {
        await this.updateStateAsync('signInFail', false);
        if (this.errorCheck(this.state, this.errorStates)) {
            return;
        }
        try {
            const response = await $.ajax({
                url: this.SIGN_IN_ENDPOINT,
                method: 'post',
                dataType: 'json',
                data: {
                    email: this.state.email,
                    password: this.state.password
                }
            });
            const data: any = response.data;
            const userInfo: UserInfo = {
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                email: this.state.email,
                authToken: data.authToken
            };
            const authState: AuthState = AuthState.getInstance();
            authState.authorize(userInfo);
            browserHistory.push('/');
        } catch (e) {
            this.updateState('signInFail', true);
        }
    }

    render() {
        return (
            <div>
                <form onKeyUp={this.handleKeyUp.bind(this)} onSubmit={this.handleSubmit.bind(this)}>
                    <div>
                        <label>
                            Email:
                            <input id="email" type="email" value={this.state.email} onChange={this.handleChange.bind(this)}/>
                            <ErrorComponent doShow={this.state.emailFormat} message='Please enter a valid email address'/>
                        </label>
                    </div>

                    <div>
                        <label>
                            Password:
                            <input id="password" type="password" value={this.state.password} onChange={this.handleChange.bind(this)}/>
                            <ErrorComponent doShow={this.state.passwordLength} message='Password not long enough!'/>
                        </label>
                    </div>

                    <input type="button" value='Sign In' onChange={this.handleSubmit.bind(this)}/>
                    <ErrorComponent doShow={this.state.signInFail} message='Invalid username or password'/>
                </form>
            </div>
        );
    }
};
