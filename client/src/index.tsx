import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, Link, browserHistory, IndexRoute, Redirect } from "react-router"

import { Hello } from "./components/Hello";
import { About } from "./components/About";
import { Unknown } from "./components/Unknown";

class App extends React.Component<undefined, undefined> {
    render() {
        return (
            <div>
            <h1>App</h1>
            <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/hello">Hello</Link></li>
            </ul>
            {this.props.children}
            </div>
        )
    }
};
ReactDOM.render((
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={Hello} />
            <Route path="about" component={About}/>
            <Route path="hello" component={Hello}/>
            <Route path="*" component={Unknown}/>
        </Route>
    </Router>
), document.getElementById('igetback-content'));
