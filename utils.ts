import * as fs from 'fs';
import * as express from 'express';

type Continuation = (req: express.Request, res: express.Response) => void;

export enum HttpMethod {
    GET,
    POST
};

export function readLines(filePath: string): string[] {
    return fs.readFileSync(filePath).toString().split('\n');
};

export class RouteManager {
    constructor(private app: express.Express) {
    }

    public addRoute(route: Route): void {
        let method: (route: string, cont: Continuation) => void;
        switch (route.httpMethod) {
            case HttpMethod.GET: {
                method = this.app.get.bind(this.app);
                break;
            }
            case HttpMethod.POST: {
                method = this.app.post.bind(this.app);
                break;
            }
        }
        method(route.route, (req, res) => {
            // import security
            if (!req.headers['cookie'] || false) {
                if (!route.isAjax) {
                    res.redirect('/login');
                } else {
                    res.status(401).send('not authorized');
                }
                return;
            }
            route.cont(req, res);
            return;
        });
    }
};

export class RouteBuilder {
    public httpMethod?: HttpMethod;
    public isSecure?: boolean;
    public isAjax?: boolean;

    constructor(readonly route: string, readonly cont: Continuation) {}

    setHttpMethod(method: HttpMethod): RouteBuilder {
        this.httpMethod = method;
        return this;
    }

    setIsSecure(isSecure: boolean): RouteBuilder {
        this.isSecure = isSecure;
        return this;
    }

    setIsAjax(isAjax: boolean): RouteBuilder {
        this.isAjax = isAjax;
        return this;
    }
};

export class Route {
    readonly route: string;
    readonly cont: Continuation;
    readonly httpMethod: HttpMethod;
    readonly isSecure: boolean;
    readonly isAjax: boolean;

    constructor(routeBuilder: RouteBuilder) {
        if (routeBuilder.httpMethod == null) {
            this.httpMethod = HttpMethod.GET;
        }

        if (routeBuilder.isSecure == null) {
            this.isSecure = false;
        }

        if (routeBuilder.isAjax == null) {
            this.isAjax = false;
        }

        this.route = routeBuilder.route;
        this.cont = routeBuilder.cont;
    }
};
