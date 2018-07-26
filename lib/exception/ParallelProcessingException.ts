export class ParallelProcessingException extends Error {
    private exceptions: Error[] = [];

    constructor(private total: number) {
        super();
    }

    addException(e: Error) {
        this.exceptions.push(e);

        this.message = `Parallel processing failed for ${this.exceptions.length} of ${this.total} stations`;
    }

    getExceptions() {
        return this.exceptions;
    }
}
