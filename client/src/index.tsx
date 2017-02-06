import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, Link, browserHistory, IndexRoute, Redirect } from "react-router"

import { Hello } from "./components/Hello";
import { About } from "./components/About";
import { Unknown } from "./components/Unknown";
import { MyNav } from "./components/Navbar";
import { SignIn } from "./components/SignIn";
import { AuthState, AuthCallback } from "../utils/signInState";
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
        authState.subscribe(updateAuthState);
        this.state = {
            signedIn: false
        };
        authState.getState().then(updateAuthState);
    }

    render() {
        return (
            <div>
            <MyNav signedIn={this.state.signedIn}/>
            <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/hello">Hello</Link></li>
                <li><Link to="/account">Account</Link></li>
            </ul>
            version 2
            {this.props.children}
            </div>
        )
    }
};
class Root extends React.Component<{}, ApplicationState> {
    constructor() {
        super();
        this.state = {
            signedIn: false
        };
        this.onSignInUpdate = this.onSignInUpdate.bind(this);
    }

    onSignInUpdate(signedIn: boolean) {
        this.setState({
            signedIn: signedIn
        });
    }

    render() {
        return (
            <div>
                <Router history={browserHistory}>
                    <Route path="/" component={App}>
                        <IndexRoute component={Hello} />
                        <Route path="about" component={About}/>
                        <Route path="hello" component={Hello}/>
                        <Route path="signIn" component={SignIn}/>
                        <Route path="account" component={Account}/>
                        <Route path="*" component={Unknown}/>
                    </Route>
                </Router>
            </div>
        );
    }
}
ReactDOM.render((<Root/>), document.getElementById('igetback-content'));
    /*
ReactDOM.render((
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={Hello} />
            <Route path="about" component={About}/>
            <Route path="hello" component={Hello}/>
            <Route path="signIn" component={SignIn}/>
            <Route path="*" component={Unknown}/>
        </Route>
    </Router>
), document.getElementById('igetback-content'));
*/
