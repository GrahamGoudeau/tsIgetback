import * as React from 'react';
import { SecureComponent } from './SecureComponent';

export class Account extends SecureComponent<{}, {}> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <div>hi</div>
        );
    }
}
