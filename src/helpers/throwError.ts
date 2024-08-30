/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus } from '@nestjs/common';

export const throwError = ({
  error,
  customMessage,
  customStatus,
}: {
  error: any;
  customMessage?: string;
  customStatus?: HttpStatus;
}): never => {
  const status =
    customStatus || error.status || HttpStatus.INTERNAL_SERVER_ERROR;
  const message =
    customMessage || error.message || 'An unexpected error occurred';

  throw new HttpException(
    {
      status,
      error: message,
    },
    status,
    {
      cause: error,
    },
  );
};
