export enum ProcessExceptionType {
    CMD = 'cmd',
    VALIDATION = 'validation',
    TEMPLATE = 'template',
    NOT_FOUND = 'not_fount',
}

export class StationException extends Error {
    constructor(
        message: string,
        public type: ProcessExceptionType,
        public payload?: any,
    ) {
        super(message);
    }
}
