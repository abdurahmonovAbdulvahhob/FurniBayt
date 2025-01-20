import {
  Logger,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseBody: any;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      responseBody =
        typeof exceptionResponse === 'object' && 'response' in exceptionResponse
          ? exceptionResponse['response']
          : exceptionResponse;
    } else {
      responseBody = {
        statusCode: status,
        message:
          exception instanceof Error
            ? exception.message
            : 'Internal server error',
      };
    }

    this.logger.error(
      `Status: ${status} Error: ${JSON.stringify(responseBody)}`,
    );

    response.status(status).json(responseBody);
  }
}
