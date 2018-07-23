import {BaseStationHandler} from '../../models';
import {A6sRailway, A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../../A6sRailway';

export class A6s_Railway_ExternalFile_StationHandler extends BaseStationHandler {
    getName(): string {
        return 'a6s.external';
    }

    async run(options: any, handlers: A6sRailwayStationHandlersRegistry, resolvers: A6sRailwayResolverRegistry): Promise<void> {
        await new A6sRailway(options)
            .setHandlers(handlers)
            .execute();
    }
}
