import * as Joi from 'joi';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as util from 'util';
import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../A6sRailway';
import {BaseStationHandler, StationContext} from '../../models';
import {IOC} from '../../services';
import {A6sRailwayUtil} from '../../utils';

export class Write_File_StationHandler extends BaseStationHandler {
    /**
     * @return {string}
     */
    getName(): string {
        return 'a6s.file.write';
    }

    /**
     * @return {ObjectSchema}
     * @constructor
     */
    static OPTIONS_SCHEMA = Joi
        .object()
        .keys({
            path: Joi.string().required(),
            content: Joi.string().required(),
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
        const result = Joi.validate(options, Write_File_StationHandler.OPTIONS_SCHEMA);

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
        const baseDir = path.dirname(options.path);

        if (!fs.existsSync(baseDir)) {
            mkdirp.sync(baseDir);
        }

        const a6sRailwayUtil = IOC.get(A6sRailwayUtil);
        const file = a6sRailwayUtil.getAbsolutePath(options.path, stationContext.getWorkingDirectory());

        await util.promisify(fs.writeFile)(file, options.content);
    }
}
