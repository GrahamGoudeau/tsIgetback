import * as React from 'react';
import { Button } from 'react-bootstrap';
import { ApplicationState } from '../index';
import { goToUrl } from '../utils/onClickUtils';
import { AuthState } from '../utils/authState';

export class SignIn extends React.Component<{}, {}> {
    constructor(props: any) {
        super(props);
    }

    async handleClick(event: any) {
        const authState: AuthState = AuthState.getInstance();
        (await authState.getState()).caseOf({
            just: u => authState.deauthorize(),
            nothing: () => authState.authorize({
                firstName: 'g',
                lastName: 'gouda',
                email: 'email'
            })
        });
        goToUrl('/', event);
    }

    render() {
        return (
            <Button onClick={this.handleClick}>Toggle</Button>
        );
    }
};
