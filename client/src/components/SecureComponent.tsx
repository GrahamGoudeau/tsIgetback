import * as React from 'react';
import { AuthState } from '../utils/authState';
import { browserHistory } from 'react-router';

export abstract class SecureComponent<P, S> extends React.Component<P, S> {
    constructor(props: P) {
        super(props);
    }

    componentWillMount() {
        const authState: AuthState = AuthState.getInstance();
        authState.getState().then((state: boolean) => {
            if (!state) {
                browserHistory.push('/login');
            }
        });
    }
}
