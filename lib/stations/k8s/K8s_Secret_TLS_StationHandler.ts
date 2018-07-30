import * as Joi from 'joi';
import * as fs from 'fs';
import {IK8sObject, IReportRecord} from '../../interfaces';
import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../A6sRailway';
import {IOC} from '../../services';
import {A6sRailwayUtil} from '../../services/utils';
import {K8s_Kubectl_ApplyObject_StationHandler} from './K8s_Kubectl_ApplyObject_StationHandler';
import {StationContext} from '../../models';

export class K8s_Secret_TLS_StationHandler extends K8s_Kubectl_ApplyObject_StationHandler {
    /**
     * @return {string}
     */
    getName(): string {
        return 'k8s.tls.secret.create';
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
                cert: Joi.string().required(),
                key: Joi.string().required(),
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
        const result = Joi.validate(options, K8s_Secret_TLS_StationHandler.OPTIONS_SCHEMA);

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
        stationContext: StationContext
    ): Promise<IReportRecord[]> {
        const object: IK8sObject = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: options.name,
            },
            type: 'kubernetes.io/tls',
            data: {},
        };

        if (options.namespace) {
            object.metadata.namespace = options.namespace;
        }

        object.data = {
            tls: {},
        };

        object.data.tls.crt = await this.loadFile(options.cert, stationContext.getWorkingDirectory());
        object.data.tls.key = await this.loadFile(options.key, stationContext.getWorkingDirectory());

        return await super.run(object, handlers, resolvers, stationContext);
    }

    /**
     * @param {string} filePath
     * @param {string} workingDirectory
     * @return {Promise<any>}
     */
    protected async loadFile(filePath: string, workingDirectory: string): Promise<any> {
        const a6sRailwayUtil = IOC.get(A6sRailwayUtil);
        filePath = a6sRailwayUtil.getAbsolutePath(filePath, workingDirectory);

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, fileData) => {
                if (!err) {
                    resolve(fileData.toString('base64'));
                } else {
                    reject(err);
                }
            });
        });
    }
}
