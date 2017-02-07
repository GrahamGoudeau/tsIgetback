import * as React from 'react';
import { Button } from 'react-bootstrap';
import { ApplicationState } from '../index';
import { goToUrl } from '../utils/onClickUtils';
import { AuthState } from '../utils/authState';
import { FormComponent } from './Form';

interface SignInState {
    email: string;
    password: string;
}

export class SignIn extends FormComponent<{}, SignInState> {
    constructor(props: any) {
        super(props);
        this.state = {
            email: '',
            password: ''
        };
    }

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
        console.log('submit');
    }

    render() {
        return (
            <div>
                <form onKeyUp={this.handleKeyUp.bind(this)} onSubmit={this.handleSubmit.bind(this)}>
                    <div>
                        <label>
                            Email:
                            <input id="email" type="email" value={this.state.email} onChange={this.handleChange.bind(this)}/>
                        </label>
                    </div>

                    <div>
                        <label>
                            Password:
                            <input id="password" type="password" value={this.state.password} onChange={this.handleChange.bind(this)}/>
                        </label>
                    </div>

                    <input type="button" onChange={this.handleSubmit.bind(this)}/>
                </form>
            </div>
        );
    }
};
