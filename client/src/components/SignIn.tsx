import * as React from 'react';
import { Button } from 'react-bootstrap';
import { ApplicationState } from '../index';
import { goToUrl } from '../utils/onClickUtils';
import { AuthState } from '../utils/authState';
import { FormComponent } from './Form';
import { ErrorComponent } from './Error';

interface SignInState {
    email: string;
    password: string;
    emailFormat: boolean;
    passwordLength: boolean;
}

interface ErrorState {
    field: keyof SignInState;
    condition: (state: SignInState) => boolean;
}

export class SignIn extends FormComponent<{}, SignInState> {
    constructor(props: any) {
        super(props);
        this.state = {
            email: '',
            password: '',
            emailFormat: false,
            passwordLength: false
        };
    }

    private readonly errorStates: ErrorState[] = [{
        field: 'emailFormat',
        condition: (state: SignInState) => state.email.indexOf('@') === -1
    }, {
        field: 'passwordLength',
        condition: (state: SignInState) => state.password.length < 6
    }];

    async handleClick(event: any) {
        const authState: AuthState = AuthState.getInstance();
        (await authState.getState()).caseOf({
            just: u => authState.deauthorize(),
            nothing: () => authState.authorize({
                firstName: 'g',
                lastName: 'gouda',
                email: 'email',
                authToken: 'IgetbackAuth=0x123'
            })
        });
        goToUrl('/', event);
    }

    async handleSubmit(event: Event) {
        if (this.errorCheck(this.state, this.errorStates)) {
            return;
        }
        console.log('success');
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

                    <input type="button" onChange={this.handleSubmit.bind(this)}/>
                </form>
            </div>
        );
    }
};
