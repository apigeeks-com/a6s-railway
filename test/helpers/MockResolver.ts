import {BaseResolver} from '../../lib/models';

export class MockResolver extends BaseResolver {
    constructor(private fn: Function, private name = 'test.resolver') {
        super();
    }

    getName(): string {
        return this.name;
    }

    async run(name: string, options: any, sharedContext: {[key: string]: any}, resolvers: {[name: string]: BaseResolver}): Promise<void> {
        await this.fn(sharedContext, options);
    }
}
