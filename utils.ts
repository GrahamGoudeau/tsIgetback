import * as fs from 'fs';
import * as express from 'express';
import * as security from './security';

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

    public addRoutes(routes: Route[]): void {
        routes.forEach(route => this.addRoute(route));
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
            default: {
                console.trace('Misconfigured route:', route);
                break;
            }
        }
        method(route.route, (req, res) => {
            const cookie: string = req.headers['cookie'];
            if (route.isSecure && !security.validateCookie(cookie)) {
                if (!route.isAjax) {
                    res.redirect('/login');
                } else {
                    unauthorizedError(res);
                }
            } else {
                route.cont(req, res);
            }
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
    readonly httpMethod: HttpMethod = HttpMethod.GET;
    readonly isSecure: boolean = false;
    readonly isAjax: boolean = false;

    constructor(routeBuilder: RouteBuilder) {
        if (routeBuilder.httpMethod != null) {
            this.httpMethod = routeBuilder.httpMethod;
        }

        if (routeBuilder.isSecure != null) {
            this.isSecure = routeBuilder.isSecure;
        }

        if (routeBuilder.isAjax != null) {
            this.isAjax = routeBuilder.isAjax;
        }

        this.route = routeBuilder.route;
        this.cont = routeBuilder.cont;
    }
};

export interface IGetBackResponse {
    error?: {
        message: string
        exn?: any
    },
    data?: any
}

function buildIGetBackResponse(message: string, error?: any): IGetBackResponse {
    const errorResponse: IGetBackResponse = {
        error: {
            message: message
        }
    };

    if (error != null) {
        errorResponse.error.exn = error;
    }

    return errorResponse;
}

export function badRequest(res: express.Response, message?: string, error?: any): void {
    const response: IGetBackResponse = buildIGetBackResponse(message == null ? 'bad request' : message, error);

    res.status(400).json(response);
}

export function internalError(res: express.Response, message?: string, error?: any): void {
    const response: IGetBackResponse = buildIGetBackResponse(message == null ? 'internal server error' : message, error);

    res.status(500).json(response);
}

export function unauthorizedError(res: express.Response, message?: string, error?: any): void {
    const response: IGetBackResponse = buildIGetBackResponse(message == null ? 'unauthorized' : message, error);

    res.status(401).json(response);
}
