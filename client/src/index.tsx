import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, Link, browserHistory, IndexRoute, Redirect } from "react-router"

import { Hello } from "./components/Hello";
import { About } from "./components/About";
import { Unknown } from "./components/Unknown";

const App = React.createClass({
    render() {
        return (
            <div>
            {this.props.children}
            </div>
        )
    }
})
ReactDOM.render((
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={Hello} />
            <Redirect from="about/" to="about"/>
            <Route path="about" component={About}/>
            <Route path="hello" component={Unknown}>
                <Route path="/user/:userId" component={Hello}/>
            </Route>
            <Route path="*" component={Unknown}/>
        </Route>
    </Router>
), document.getElementById('igetback-content'))
