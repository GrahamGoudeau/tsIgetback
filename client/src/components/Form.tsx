import * as React from 'react';

export abstract class FormComponent<P, S> extends React.Component<P, S> {
    constructor(props: P) {
        super(props);
    }

    // listen for ENTER key and call this.handleSubmit with the event
    handleKeyUp(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.handleSubmit(event);
        }
    }

    handleSubmit(event: Event) {}

    // update the state's key with the same ID as the input element it came from
    handleChange(event: Event) {
        event.preventDefault();
        const newStateField: any = {};
        const id: string = (event.target as HTMLElement).id as string;
        const value: string = (event.target as HTMLInputElement).value as string;
        this.setState(Object.assign({},
            this.state,
            {
                [id]: value
            }
        ));
    }
}
