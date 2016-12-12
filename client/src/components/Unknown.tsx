import * as React from "react";

export interface HelloProps { compiler: string; framework: string; }

export class Unknown extends React.Component<HelloProps, undefined> {
    render() {
        return <h1>Unknown</h1>;
    }
}

