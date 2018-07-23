import {BaseStationHandler} from '../../models';
import {A6sRailway, A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../../A6sRailway';
import * as Joi from 'joi';
import {resolve} from 'path';
import {IOC} from '../../services';
import {A6sRailwayUtil} from '../../services/utils';

export class A6s_Railway_ExternalFile_StationHandler extends BaseStationHandler {
    getName(): string {
        return 'a6s.external';
    }

    private static OPTIONS_SCHEMA = Joi.object().min(1)
        .required()
        .options({ abortEarly: true, allowUnknown: true });

    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, A6s_Railway_ExternalFile_StationHandler.OPTIONS_SCHEMA);

        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    async run(options: any, handlers: A6sRailwayStationHandlersRegistry, resolvers: A6sRailwayResolverRegistry): Promise<void> {
        const a6sRailwayUtil = IOC.get(A6sRailwayUtil);
        let content;

        if (options.file) {
            const file = a6sRailwayUtil.getAbsolutePath(options.file);

            content = await a6sRailwayUtil.readYamlFile(file);
        } else {
            content = options;
        }

        await new A6sRailway(content)
            .setHandlers(handlers)
            .execute();


    }
}
