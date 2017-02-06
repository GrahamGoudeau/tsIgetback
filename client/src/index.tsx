import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Link, browserHistory, IndexRoute, Redirect } from 'react-router'

import { Hello } from './components/Hello';
import { About } from './components/About';
import { Unknown } from './components/Unknown';
import { MyNav } from './components/Navbar';
import { SignIn } from './components/SignIn';
import { AuthState, AuthCallback } from './utils/authState';
import { Account } from './components/Account';

export interface ApplicationState {
    signedIn: boolean
};

class App extends React.Component<{}, ApplicationState> {
    constructor(props: any) {
        super(props);
        const authState: AuthState = AuthState.getInstance();
        const updateAuthState: AuthCallback = (state: boolean) => {
            this.setState({
                signedIn: state
            });
        };
        this.state = {
            signedIn: false
        };

        authState.subscribe(updateAuthState);
        authState.getState().then(updateAuthState);
    }

    render() {
        return (
            <div>
            <MyNav signedIn={this.state.signedIn}/>
            {this.props.children}
            </div>
        )
    }
};
class Root extends React.Component<{}, ApplicationState> {
    constructor() {
        super();
    }

    render() {
        return (
            <div>
                <Router history={browserHistory}>
                    <Route path='/' component={App}>
                        <IndexRoute component={Hello} />
                        <Route path='about' component={About}/>
                        <Route path='hello' component={Hello}/>
                        <Route path='signIn' component={SignIn}/>
                        <Route path='account' component={Account}/>
                        <Route path='*' component={Unknown}/>
                    </Route>
                </Router>
            </div>
        );
    }
}
ReactDOM.render((<Root/>), document.getElementById('igetback-content'));
