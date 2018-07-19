import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../lib/A6sRailway';
import {BaseStationHandler} from '../../lib/models';

export class MockFailedValidationStationHandler extends BaseStationHandler {
    constructor(private name = 'test.station') {
        super();
    }

    getName(): string {
        return this.name;
    }

    async validate(options: any) {
        throw new Error('test validation');
    }

    async run(
        options: any,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry
    ): Promise<void> {} // tslint:disable-line
}
