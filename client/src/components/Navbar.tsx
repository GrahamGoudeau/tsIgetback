import * as React from 'react';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Button } from 'react-bootstrap';
import { ApplicationState } from '../index';
import { goToUrl } from '../utils/onClickUtils';
import { AuthState } from '../utils/authState';
import { browserHistory } from 'react-router';

export class MyNav extends React.Component<ApplicationState, {}> {
    constructor(props: ApplicationState) {
        super(props);
    }

    showOrHide(p: boolean) {
        if (p) {
            return '';
        }
        return 'hidden';
    }

    signOut() {
        const authState: AuthState = AuthState.getInstance();
        authState.setState(false);
        browserHistory.push('/');
    }


    render() {
        return (
            <Navbar>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a href='' onClick={goToUrl('/')}>I Get Back</a>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <NavItem eventKey={1} href='' onClick={goToUrl('/t')}>Campus → Airport</NavItem>
                        <NavItem eventKey={2} href=''>Airport → Campus</NavItem>
                    </Nav>
                    <Nav pullRight>
                        <NavItem className={this.showOrHide(this.props.signedIn)} eventKey={3} href='' onClick={this.signOut}>Sign Out</NavItem>
                        <NavItem className={this.showOrHide(!this.props.signedIn)} eventKey={4} href='' onClick={goToUrl('/register')}>Register</NavItem>
                        <NavItem className={this.showOrHide(!this.props.signedIn)} eventKey={5} href='' onClick={goToUrl('/signIn')}>Sign In</NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
};
