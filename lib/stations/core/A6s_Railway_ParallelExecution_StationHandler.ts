import {BaseStationHandler} from '../../models';
import {IRailWayStation} from '../../interfaces';
import {A6sRailwayUtil} from '../../services/utils';
import {IOC} from '../../services';
import {A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../../A6sRailway';
import {IRailWayStation_JOI_SCHEMA} from '../../interfaces/core';
import * as Joi from 'joi';

export class A6s_Railway_ParallelExecution_StationHandler extends BaseStationHandler {
    private get a6sRailwayUtil(): A6sRailwayUtil {
        return IOC.get(A6sRailwayUtil);
    }

    private static OPTIONS_SCHEMA = Joi.array()
        .min(1)
        .items(IRailWayStation_JOI_SCHEMA).required()
        .options({ abortEarly: true });

    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, A6s_Railway_ParallelExecution_StationHandler.OPTIONS_SCHEMA);
        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    getName(): string {
        return 'a6s.parallel';
    }

    isShouldProcessVariablesInOptions(): boolean {
        return false;
    }

    async run(options: any, handlers: A6sRailwayStationHandlersRegistry, resolvers: A6sRailwayResolverRegistry): Promise<void> {
        const errors: Error[] = [];
        const promises = options.map(async (s: IRailWayStation): Promise<void> => {
            try {
                await this.a6sRailwayUtil.processStation(s, handlers, resolvers);
            } catch (e) {
                errors.push(new Error([
                    '------------------',
                    `Parallel execution of plugin ${s.name} failed.`,
                    e.message,
                    '------------------',
                ].join('\n')));
            }
        });

        await Promise.all(promises);

        if (errors.length) {
            throw new Error(errors.join('\n\n'));
        }
    }
}
