import * as React from 'react';
import { Component } from './Component';
import { IGetBackStyles } from '../utils/style';

export class FormContainer extends Component<{header: string, width: string}, {}> {
    render() {
        const style = {
            marginTop: '5%',
            marginLeft: this.props.width,
            marginRight: this.props.width,
            padding: '5%',
            textAlign: 'center',
            borderRadius: '2em',
            backgroundColor: IGetBackStyles.BLUE
        };
        const headerStyle = {
            fontSize: '2em',
            //marginBottom: '5%'
        };
        return (
            <div style={{width: '100%', height: '80%'}}>
                <div style={style}>
                    <div style={headerStyle}>{this.props.header}</div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
