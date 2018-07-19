import * as Joi from 'joi';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import {A6sRailwayStationHandlersRegistry} from '../../A6sRailway';
import {BaseStationHandler} from '../../models';

export class Write_File_StationHandler extends BaseStationHandler {
    /**
     * @return {string}
     */
    getName(): string {
        return 'k8s.file.write';
    }

    /**
     * @return {ObjectSchema}
     * @constructor
     */
    static OPTIONS_SCHEMA() {
        return Joi
            .object()
            .keys({
                path: Joi.string().required(),
                content: Joi.string().optional(),
            })
            .required()
            .options({
                abortEarly: true,
            })
        ;
    }

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
     * @param {A6sRailwayStationHandlersRegistry} plugins
     * @return {Promise<void>}
     */
    async run(options: any, plugins: A6sRailwayStationHandlersRegistry): Promise<void> {
        const baseDir = path.dirname(options.path);

        if (!fs.existsSync(baseDir)) {
            mkdirp.sync(baseDir);
        }

        await fs.writeFile.__promisify__(options.path, options.content);
    }
}
