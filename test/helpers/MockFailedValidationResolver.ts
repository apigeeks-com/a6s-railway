import {BaseResolver} from '../../lib/models';

export class MockFailedValidationResolver extends BaseResolver {
    constructor(private name = 'test.resolver') {
        super();
    }

    getName(): string {
        return this.name;
    }

    async validate(options: any) {
        throw new Error('test validation');
    }

    async run(
        name: string,
        options: any,
        sharedContext: object,
        resolvers: {[name: string]: BaseResolver}
    ): Promise<void> {} // tslint:disable-line
}
