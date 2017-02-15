import * as React from 'react';
import { browserHistory } from 'react-router';
import { Button } from 'react-bootstrap';
import { ApplicationState } from '../index';
import { goToUrl } from '../utils/onClickUtils';
import { UserInfo, AuthState } from '../utils/authState';
import { IGetBackStyles } from '../utils/style';
import { ErrorState, FormComponent } from './Form';
import { Message } from './Message';
import { FormContainer } from './FormContainer';

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
        if (await this.errorCheck(this.state, this.errorStates)) {
            await this.updateStateAsync('signInFail', false);
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

    testFocus(e: any) {
        console.log(e);
    }

    render() {
        return (
            <FormContainer width='35%' header='Sign In'>
                <form onKeyUp={this.handleKeyUp.bind(this)} onSubmit={this.handleSubmit.bind(this)}>
                    <input placeholder="Email" id="email" style={IGetBackStyles.inputBoxStyle} onFocus={this.testFocus} type="email" value={this.state.email} onChange={this.handleChange.bind(this)}/>
                    <Message reserveSpace={false} color={IGetBackStyles.WHITE} doShow={this.state.emailFormat} message='Please enter a valid email address'/>

                    <br/>
                    <input placeholder="Password" id="password" style={IGetBackStyles.inputBoxStyle} type="password" value={this.state.password} onChange={this.handleChange.bind(this)}/>
                    <Message reserveSpace={false} color={IGetBackStyles.WHITE} doShow={this.state.passwordLength} message='Password not long enough'/>

                    <br/>
                    <input style={IGetBackStyles.buttonStyle.submitButton} type="button" value='Sign In' onClick={this.handleSubmit.bind(this)} onChange={this.handleSubmit.bind(this)}/>
                    <Message reserveSpace={true} doShow={this.state.signInFail} color={IGetBackStyles.WHITE} message='Invalid username or password'/>
                </form>
            </FormContainer>
        );
    }
};
