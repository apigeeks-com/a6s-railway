export enum ProcessExceptionType {
    CMD_ERROR = 'cmd_error',
    VALIDATION_ERROR = 'validation_error',
    TEMPLATE_ERROR = 'template_error',
}

export class ProcessException extends Error {
    constructor(
        message: string,
        public type: ProcessExceptionType,
        public payload?: any,
    ) {
        super(message);
    }
}
