import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as fs from 'fs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const request = ctx.getRequest();

        // Debug logging to file
        try {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                path: httpAdapter.getRequestUrl(request),
                method: httpAdapter.getRequestMethod(request),
                body: request.body,
                user: request.user,
                error: exception instanceof Error ? {
                    message: exception.message,
                    stack: exception.stack,
                    name: exception.name
                } : exception
            };
            fs.writeFileSync('/Users/hirushadilshan/Desktop/Cloudex/error_dump.json', JSON.stringify(debugInfo, null, 2));
        } catch (e) {
            console.error('Failed to write error dump', e);
        }

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(request),
            message: exception instanceof Error ? exception.message : 'Internal server error',
        };

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
