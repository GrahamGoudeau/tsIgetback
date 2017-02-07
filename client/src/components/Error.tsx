import * as React from 'react';

export interface ErrorProps {
    doShow: boolean;
    message: string;
}

export class ErrorComponent extends React.Component<ErrorProps, {}> {
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
