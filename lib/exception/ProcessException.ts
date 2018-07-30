export enum ProcessExceptionType {
    CMD = 'cmd',
    VALIDATION = 'validation',
    TEMPLATE = 'template',
    NOT_FOUNT = 'not_fount',
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
