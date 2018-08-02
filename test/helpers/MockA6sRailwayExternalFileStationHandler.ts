import {A6s_Railway_ExternalFile_StationHandler} from '../../lib/stations/core';
import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../lib/A6sRailway';
import {StationContext} from '../../lib/models';
import {ProcessExceptionType, StationException} from '../../lib/exception';

export class MockA6sRailwayExternalFileStationHandler extends A6s_Railway_ExternalFile_StationHandler {
    async run(
        options: any,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry,
        stationContext: StationContext,
    ): Promise<void> {
        try {
            await super.run(options, handlers, resolvers, stationContext);
        } catch (e) {
            if (e instanceof StationException && e.type === ProcessExceptionType.NOT_FOUND) {
                e.message = 'ENOENT: no such file or directory';
            }

            throw e;
        }
    }
}
