import * as Joi from 'joi';
import {IK8sObject, IReportRecord} from '../../interfaces';
import {A6sRailwayStationHandlersRegistry} from '../../A6sRailway';
import {K8s_Kubectl_ApplyObject_StationHandler} from './K8s_Kubectl_ApplyObject_StationHandler';

export class K8s_Secret_Docker_Registry_StationHandler extends K8s_Kubectl_ApplyObject_StationHandler {
    /**
     * @return {string}
     */
    getName(): string {
        return 'k8s.docker.secret.create';
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
                server: Joi.string().required(),
                username: Joi.string().required(),
                password: Joi.string().required(),
                email: Joi.string().required(),
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
        const result = Joi.validate(options, K8s_Secret_Docker_Registry_StationHandler.OPTIONS_SCHEMA);

        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    /**
     * @param options
     * @param {A6sRailwayStationHandlersRegistry} plugins
     * @return {Promise<IReportRecord[]>}
     */
    async run(options: any, plugins: A6sRailwayStationHandlersRegistry): Promise<IReportRecord[]> {
        const object: IK8sObject = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: options.name,
            },
            type: 'kubernetes.io/dockerconfigjson',
            data: {
                '.dockerconfigjson': Buffer.from(JSON.stringify({
                    auths: {
                        [options.server]: {
                            'username': options.username,
                            'password': options.password,
                            'email': options.email,
                            'auth': Buffer.from(`${options.username}:${options.password}`).toString('base64'),
                        },
                    },
                })).toString('base64'),
            },
        };

        if (options.namespace) {
            object.metadata.namespace = options.namespace;
        }

        return await super.run(object, plugins);
    }
}
