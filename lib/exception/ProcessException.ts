export enum ProcessExceptionType {
    CMD_ERROR = 'cmd_error',
}

export class ProcessException extends Error {
    constructor(
        message: string,
        public type: string,
        public payload?: any,
    ) {
        super(message);
    }
}
