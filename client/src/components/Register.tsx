import * as React from 'react';
import { browserHistory } from 'react-router';
import { AuthState } from '../utils/authState';
import { showOrHide } from '../utils/onClickUtils';

import { ErrorComponent } from './Error';
import { ErrorState, FormComponent } from './Form';
import { FormContainer } from './FormContainer';
import { IGetBackStyles } from '../utils/style';

interface InputState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirm: string;
    passwordLength: boolean;
    passwordMatch: boolean;
    emailError: boolean;
    firstNameError: boolean;
    lastNameError: boolean;
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
            emailError: false,
            firstNameError: false,
            lastNameError: false
        };
    }

    private readonly errorStates: ErrorState<InputState>[] = [{
        field: 'passwordLength',
        condition: (state: InputState) => state.password.length < 6
    }, {
        field: 'emailError',
        condition: (state: InputState) => !/^.+@.+\.edu/.test(state.email)
    }, {
        field: 'firstNameError',
        condition: (state: InputState) => state.firstName.length === 0
    }, {
        field: 'lastNameError',
        condition: (state: InputState) => state.lastName.length === 0
    }, {
        field: 'passwordMatch',
        condition: (state: InputState) => state.password !== state.passwordConfirm
    }];

    async handleSubmit(event: Event) {
        event.preventDefault();
        if (await this.errorCheck(this.state, this.errorStates)) {
            return;
        }

        try {
            console.log('here');
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
            console.log('redir');
            browserHistory.push('/signIn');
        } catch (e) {
            console.log('err', e);
        }
    }

    render() {
        return (
            <FormContainer width='15%' header='Register'>
                <form onKeyUp={this.handleKeyUp.bind(this)} onSubmit={this.handleSubmit.bind(this)}>
                    <div id="columnContainer" style={{
                            overflow: 'hidden'
                        }}>
                        <div id="leftColumn" style={{
                            float: 'left',
                            width: '50%'
                        }}>
                            <input placeholder="First Name"
                                style={IGetBackStyles.inputBoxStyle}
                                id="firstName"
                                type="text"
                                value={this.state.firstName}
                                onChange={this.handleChange.bind(this)}/>
                            <ErrorComponent
                                color={IGetBackStyles.WHITE}
                                reserveSpace={true}
                                doShow={this.state.firstNameError}
                                message='Must have a first name'/>

                            <br/>
                            <input placeholder="Last Name"
                                style={IGetBackStyles.inputBoxStyle}
                                id="lastName"
                                type="text"
                                value={this.state.lastName}
                                onChange={this.handleChange.bind(this)}/>
                            <ErrorComponent
                                color={IGetBackStyles.WHITE}
                                reserveSpace={true}
                                doShow={this.state.lastNameError}
                                message='Must have a last name'/>

                            <br/>
                            <input placeholder="Email"
                                style={IGetBackStyles.inputBoxStyle}
                                id="email"
                                type="email"
                                value={this.state.email}
                                onChange={this.handleChange.bind(this)}/>
                            <ErrorComponent
                                color={IGetBackStyles.WHITE}
                                reserveSpace={true}
                                doShow={this.state.emailError}
                                message='Please enter a valid .edu email'/>
                        </div>

                        <div id="rightColumn" style={{
                            float: 'left',
                            width: '50%'
                        }}>
                            <input placeholder="Password"
                                style={IGetBackStyles.inputBoxStyle}
                                id="password"
                                type="password"
                                value={this.state.password}
                                onChange={this.handleChange.bind(this)}/>
                            <ErrorComponent
                                color={IGetBackStyles.WHITE}
                                reserveSpace={true}
                                doShow={this.state.passwordLength}
                                message='Password must be at least six characters'/>

                            <br/>
                            <input placeholder="Confirm password"
                                style={IGetBackStyles.inputBoxStyle}
                                id="passwordConfirm"
                                type="password"
                                value={this.state.passwordConfirm}
                                onChange={this.handleChange.bind(this)}/>
                            <ErrorComponent
                                color={IGetBackStyles.WHITE}
                                reserveSpace={true}
                                doShow={this.state.passwordMatch}
                                message='Passwords must match'/>
                            <input style={IGetBackStyles.buttonStyle.submitButton}
                                type="button"
                                value="Register"
                                onClick={this.handleSubmit.bind(this)}/>
                        </div>
                    </div>
                </form>
            </FormContainer>
        );
    }
}
