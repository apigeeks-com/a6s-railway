import {BaseStationHandler} from '../../models';
import {A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../../A6sRailway';
import * as Joi from 'joi';
import {A6sRailwayUtil} from '../../services/utils';
import {IOC} from '../../services';
import {IRailWayStation_JOI_SCHEMA} from '../../interfaces/core';

export class A6s_Railway_If_StationHandler extends BaseStationHandler {
    private get a6sRailwayUtil(): A6sRailwayUtil {
        return IOC.get(A6sRailwayUtil);
    }

    getName(): string {
        return 'a6s.if';
    }

    private static OPTIONS_SCHEMA = Joi.object().keys({
        value: Joi.string().required(),
        equals: Joi.alternatives([
            Joi.string(),
            Joi.boolean()
        ]).allow(null).required(),
        station: IRailWayStation_JOI_SCHEMA.required()
    }).required().options({
        abortEarly: true
    });

    isShouldProcessVariablesInOptions(): boolean {
        return false;
    }

    async validate(options: any): Promise<void> {
        options.value = this.a6sRailwayUtil._processOptionsTemplate(options.value);

        const result = Joi.validate(options, A6s_Railway_If_StationHandler.OPTIONS_SCHEMA);

        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    async run(
        options: any,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry,
        parentsPath: string[]
    ): Promise<void> {
       if (options.value === options.equals) {
           await this.a6sRailwayUtil.processStation(options.station, handlers, resolvers, parentsPath);
       }
    }
}
