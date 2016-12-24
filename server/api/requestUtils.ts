import * as express from 'express';

export interface AuthToken {
    email: string,
    authorizedAt: Date
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

