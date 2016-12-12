import * as React from "react";

export interface HelloProps { compiler: string; framework: string; }

export class About extends React.Component<HelloProps, undefined> {
    render() {
        return <h1>About</h1>;
    }
}

