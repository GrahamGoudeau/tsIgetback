import * as React from 'react';
import { Component } from './Component';

export interface ErrorProps {
    reserveSpace: boolean;
    doShow: boolean;
    message: string;
    color: string;
}

export class ErrorComponent extends Component<ErrorProps, {}> {
    constructor(props: ErrorProps) {
        super(props);
    }

    render() {
        if (this.props.reserveSpace) {
            return (
                <div style={{color: this.props.color, visibility: this.props.doShow ? '' : 'hidden'}}>
                    {this.props.message}
                </div>
            );
        }
        else if (this.props.doShow) {
            return (
                <div style={{color: this.props.color}}>
                    {this.props.message}
                </div>
            );
        }
        return null;
    }
}
