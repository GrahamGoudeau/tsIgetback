import * as React from 'react';
import { Component } from './Component';

export interface ErrorProps {
    doShow: boolean;
    message: string;
}

export class ErrorComponent extends Component<ErrorProps, {}> {
    constructor(props: ErrorProps) {
        super(props);
    }

    render() {
        if (this.props.doShow) {
            return (
                <div style={{color: 'red'}}>
                    {this.props.message}
                </div>
            );
        }
        return null;
    }
}
