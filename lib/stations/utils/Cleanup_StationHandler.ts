import {BaseStationHandler, StationContext} from '../../models';
import * as Joi from 'joi';
import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../A6sRailway';
import {CleanupUtil} from '../../services/utils/CleanupUtil';
import {IOC} from '../../services';

export class Cleanup_StationHandler extends BaseStationHandler {
    getName(): string {
        return 'a6s.cleanup';
    }

    static OPTIONS_SCHEMA = Joi
        .object()
        .keys({
            namespace: Joi.string().default('default'),
            allowed: Joi.object({
                storageClass: Joi.array().min(1).items(Joi.string().required()),
                pvc: Joi.array().min(1).items(Joi.string().required()),
                helms: Joi.array().min(1).items(Joi.string().required()),
                secrets: Joi.array().min(1).items(Joi.string().required()),
                configMaps: Joi.array().min(1).items(Joi.string().required()),
            })
        })
        .required()
        .options({
            abortEarly: true,
        })
    ;

    /**
     * @param options
     * @return {Promise<void>}
     */
    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, Cleanup_StationHandler.OPTIONS_SCHEMA);

        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    /**
     * @param options
     * @param {A6sRailwayStationHandlersRegistry} handlers
     * @param {A6sRailwayResolverRegistry} resolvers
     * @param {StationContext} stationContext
     * @return {Promise<void>}
     */
    async run(
        options: any,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry,
        stationContext: StationContext,
    ): Promise<void> {
        const cleanupUtil: CleanupUtil = IOC.get(CleanupUtil);

        await cleanupUtil.clean(options);
    }
}
