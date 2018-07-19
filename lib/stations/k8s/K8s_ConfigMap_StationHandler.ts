import {IK8sObject} from '../../interfaces';
import * as Joi from 'joi';
import {A6sRailwayStationHandlersRegistry} from '../../A6sRailway';
import * as fs from 'fs';
import {K8s_Kubectl_ApplyObject_StationHandler} from './K8s_Kubectl_ApplyObject_StationHandler';
import {basename} from 'path';
import {IOC} from '../../services';
import {A6sRailwayUtil} from '../../services/utils';

export class K8s_ConfigMap_StationHandler extends K8s_Kubectl_ApplyObject_StationHandler {
    /**
     * @return {string}
     */
    getName(): string {
        return 'k8s.configMap.create';
    }

    /**
     * @return {ObjectSchema}
     * @constructor
     */
    protected static get OPTIONS_SCHEMA() {
        return Joi
            .object()
            .keys({
                name: Joi.string().required(),
                namespace: Joi.string().optional(),
                files: Joi.array().min(1).items(Joi.string().required()).optional(),
                inline: Joi.object()
                    .pattern(
                        /[\w|\d]+/,
                        Joi.alternatives([Joi.string(), Joi.number()]),
                    )
                    .min(1)
                    .optional(),
            })
            .required()
            .options({
                abortEarly: true,
            })
            .or(['files', 'inline'])
        ;
    }

    /**
     * @param options
     * @return {Promise<void>}
     */
    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, K8s_ConfigMap_StationHandler.OPTIONS_SCHEMA);

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
        const object: IK8sObject = {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
                name: options.name,
            },
            data: {},
        };

        if (options.namespace) {
            object.metadata.namespace = options.namespace;
        }

        if (options.inline) {
            for (const key of Object.keys(options.inline)) {
                object.data[key] = Buffer.from(options.inline[key].toString()).toString();
            }
        }

        if (options.files) {
            for (const file of options.files) {
                object.data[basename(file)] = await this.loadFile(file);
            }
        }

        await super.run(object, plugins);
    }

    /**
     * @param {string} filePath
     * @return {Promise<any>}
     */
    protected async loadFile(filePath: string): Promise<any> {
        const a6sRailwayUtil = IOC.get(A6sRailwayUtil);
        filePath = a6sRailwayUtil.getAbsolutePath(filePath);

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, fileData) => {
                if (!err) {
                    resolve(fileData.toString());
                } else {
                    reject(err);
                }
            });
        });
    }
}
