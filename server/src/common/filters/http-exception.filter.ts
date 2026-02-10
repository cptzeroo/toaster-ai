import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly debugMode: boolean = false) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If response headers are already sent (e.g. streaming), we can't send another response
    if (response.headersSent) {
      this.logger.error(
        `Exception after headers sent on ${request.method} ${request.url}: ${
          exception instanceof Error ? exception.message : 'Unknown error'
        }`,
      );
      return;
    }

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, any>;
        message = res.message || exception.message;
        error = res.error || HttpStatus[status] || 'Error';
      } else {
        message = exception.message;
        error = HttpStatus[status] || 'Error';
      }

      // In debug mode, log stack traces for HTTP exceptions too
      if (this.debugMode) {
        this.logger.warn(
          `[${status}] ${request.method} ${request.url} - ${error}: ${
            Array.isArray(message) ? message.join(', ') : message
          }`,
          exception.stack,
        );
      }
    } else {
      // Unexpected errors -- always log these
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';

      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: Record<string, any> = {
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // In debug mode, include the stack trace in the response body
    if (this.debugMode && exception instanceof Error) {
      body.stack = exception.stack;
    }

    response.status(status).json(body);
  }
}
