export class ParallelException extends Error {
    private exceptions: Error[] = [];

    constructor() {
        super('Parallel execution');
    }

    addException(e: Error) {
        this.exceptions.push(e);
    }

    getExceptions() {
        return this.exceptions;
    }
}
