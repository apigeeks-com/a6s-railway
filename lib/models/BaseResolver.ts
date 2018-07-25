import {IReportRecord} from '../interfaces';

export abstract class BaseResolver {
    /**
     * Get resolver name
     * @returns {string}
     */
    abstract getName(): string;

    /**
     * Validate options before processing
     * @param options
     * @returns {Promise<void>}
     */
    async validate(options: any): Promise<void> {} // tslint:disable-line

    /**
     * Run resolver
     * @param name
     * @param options
     * @param sharedContext
     * @param resolvers
     * @returns {Promise<void>}
     */
    async run(name: string, options: any, sharedContext: object, resolvers: {[name: string]: BaseResolver}): Promise<IReportRecord[] | void> {} // tslint:disable-line
}
