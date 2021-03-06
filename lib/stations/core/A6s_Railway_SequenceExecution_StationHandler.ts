import {BaseStationHandler, StationContext} from '../../models';
import {A6sRailwayUtil} from '../../utils';
import {IOC} from '../../services';
import {IRailWayStation_JOI_SCHEMA} from '../../interfaces/core';
import {A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../../A6sRailway';
import * as Joi from 'joi';

export class A6s_Railway_SequenceExecution_StationHandler extends BaseStationHandler {
    private get a6sRailwayUtil(): A6sRailwayUtil {
        return IOC.get(A6sRailwayUtil);
    }

    private static OPTIONS_SCHEMA = Joi.array()
        .min(1)
        .items(IRailWayStation_JOI_SCHEMA).required()
        .options({ abortEarly: true });

    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, A6s_Railway_SequenceExecution_StationHandler.OPTIONS_SCHEMA);
        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    getName(): string {
        return 'a6s.sequence';
    }

    isShouldProcessVariablesInOptions(): boolean {
        return false;
    }

    async run(
        options: any,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry,
        stationContext: StationContext,
    ): Promise<void> {
        for (const s of options) {
            await this.a6sRailwayUtil.processStation(
                s,
                handlers,
                resolvers,
                stationContext.clone()
            );
        }
    }
}
