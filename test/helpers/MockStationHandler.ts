import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../lib/A6sRailway';
import {BaseStationHandler} from '../../lib/models';

export class MockStationHandler extends BaseStationHandler {
    constructor(private fn: Function, private name = 'test.station') {
        super();
    }

    getName(): string {
        return this.name;
    }

    async run(options: any, handlers: A6sRailwayStationHandlersRegistry, resolvers: A6sRailwayResolverRegistry): Promise<void> {
        await this.fn(options);
    }
}
