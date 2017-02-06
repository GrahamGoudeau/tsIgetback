import * as React from "react";
import { Button } from "react-bootstrap";
import { ApplicationState } from '../index';
import { goToUrl } from '../utils';
import { AuthState } from '../../utils/signInState';

export class SignIn extends React.Component<{}, {}> {
    constructor(props: any) {
        super(props);
    }

    async handleClick(event: any) {
        const authState: AuthState = AuthState.getInstance();
        const state: boolean = await authState.getState();

        authState.setState(!state);
        goToUrl('/', event);
    }

    render() {
        return (
            <Button onClick={this.handleClick}>Toggle</Button>
        );
    }
};
