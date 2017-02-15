import * as React from 'react';
import { Component } from './Component';

export interface MessageProps {
    reserveSpace: boolean;
    doShow: boolean;
    message: string;
    color: string;
}

export class Message extends Component<MessageProps, {}> {
    constructor(props: MessageProps) {
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
