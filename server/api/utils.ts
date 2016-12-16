import * as fs from 'fs';
import * as express from 'express';
import * as security from './security';
import * as tsmonad from 'tsmonad';

export const DOMAIN_NAME: string = 'www.igetback.at';
export const VERIFY_ENDPOINT: string = 'verifyEmail';

export type InsecureContinuation = (req: express.Request,
                                    res: express.Response) => void;

export type SecureContinuation = (req: express.Request,
                                  res: express.Response,
                                  authToken: security.AuthToken) => void;

export enum HttpMethod {
    GET,
    POST,
    DELETE,
};

export function readLines(filePath: string): string[] {
    return fs.readFileSync(filePath).toString().split('\n');
};

export class RouteManager {
    constructor(private app: express.Express) {
    }

    public addSecureRoutes(routes: SecureRoute[]): void {
        routes.forEach(route => this.addSecureRoute(route));
    }

    public addInsecureRoutes(routes: InsecureRoute[]): void {
        routes.forEach(route => this.addInsecureRoute(route));
    }

    private determineMethod(method: HttpMethod): (string, ExpressContinuation) => void {
        switch (method) {
            case HttpMethod.GET: {
                return this.app.get.bind(this.app);
            }
            case HttpMethod.POST: {
                return this.app.post.bind(this.app);
            }
            case HttpMethod.DELETE: {
                return this.app.delete.bind(this.app);
            }
            default: {
                throw new Error('misconfigured route');
            }
        }
    }

    public addInsecureRoute(route: InsecureRoute): void {
        let method: (string, ExpressContinuation) => void = this.determineMethod(route.httpMethod);
        method(route.route, route.cont);
    }

    public addSecureRoute(route: SecureRoute): void {
        let method: (string, ExpressContinuation) => void = this.determineMethod(route.httpMethod);

        method(route.route, (req, res) => {
            const cookie: string = req.headers['cookie'];
            const authTokenResult: tsmonad.Maybe<security.AuthToken> = security.parseCookie(cookie);
            const unauthorizedCont = () => {
                if (!route.isAjax) {
                    res.redirect('/login');
                } else {
                    unauthorizedError(res);
                }
            };

            authTokenResult.caseOf({
                just: async (token: security.AuthToken) => {
                    if (!(await security.validateAuthToken(token))) {
                        unauthorizedCont();
                    } else {
                        route.cont(req, res, token);
                    }
                },
                nothing: async () => {
                    unauthorizedCont();
                }
            });
        });
    }
};

class RouteBuilder {
    public httpMethod?: HttpMethod;
    public isAjax?: boolean;

    constructor(readonly route: string) {}

    setHttpMethod<T extends RouteBuilder>(method: HttpMethod): T {
        this.httpMethod = method;
        return <T><any>this;
    }

    setIsAjax<T extends RouteBuilder>(isAjax: boolean): T {
        this.isAjax = isAjax;
        return <T><any>this;
    }
};

export class InsecureRouteBuilder extends RouteBuilder {
    constructor(readonly route: string, readonly cont: InsecureContinuation) {
        super(route);
    }
}

export class SecureRouteBuilder extends RouteBuilder {
    constructor(readonly route: string, readonly cont: SecureContinuation) {
        super(route);
    }
}

class Route {
    constructor(readonly route: string,
                readonly httpMethod?: HttpMethod,
                readonly isAjax?: boolean) {
        if (!httpMethod) {
            this.httpMethod = HttpMethod.GET;
        }

        if (!isAjax) {
            this.isAjax = false;
        }
    }
};

export class InsecureRoute extends Route {
    readonly cont: InsecureContinuation;
    constructor(builder: InsecureRouteBuilder) {
        super(builder.route, builder.httpMethod, builder.isAjax);
        this.cont = builder.cont;
    }
}

export class SecureRoute extends Route {
    readonly cont: SecureContinuation;
    constructor(builder: SecureRouteBuilder) {
        super(builder.route, builder.httpMethod, builder.isAjax);
        this.cont = builder.cont;
    }
}

export function isProduction(): boolean {
    return process.env.PRODUCTION === 'true';
}

export interface IGetBackResponse {
    error?: {
        message: string
        exn?: any
    },
    data?: any
}

function buildIGetBackError(message: string, error?: any): IGetBackResponse {
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
    const response: IGetBackResponse = buildIGetBackError(message == null ? 'bad request' : message, error);

    res.status(400).json(response);
}

export function internalError(res: express.Response, message?: string, error?: any): void {
    const response: IGetBackResponse = buildIGetBackError(message == null ? 'internal server error' : message, error);

    res.status(500).json(response);
}

export function unauthorizedError(res: express.Response, message?: string, error?: any): void {
    const response: IGetBackResponse = buildIGetBackError(message == null ? 'unauthorized' : message, error);

    res.status(401).json(response);
}

export function jsonResponse(res: express.Response, result: any): void {
    const response: IGetBackResponse = {
        data: result
    };

    res.status(200).json(response);
}

export function successResponse(res: express.Response): void {
    res.status(200).send();
}
