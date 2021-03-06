import {BaseStationHandler, StationContext} from '../../models';
import {IK8sObject, IReportRecord, IReportRecordType} from '../../interfaces';
import {IOC} from '../../services';
import {K8sKubectlUtil} from '../../utils';
import * as Joi from 'joi';
import {IK8sObject_JOI_SCHEMA} from '../../interfaces/k8s';
import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../A6sRailway';

export class K8s_Kubectl_ApplyObject_StationHandler extends BaseStationHandler {
    /**
     * @return {K8sKubectlUtil}
     */
    private get k8sKubectlUtil(): K8sKubectlUtil {
        return IOC.get(K8sKubectlUtil);
    }

    /**
     * @return {string}
     */
    getName(): string {
        return'k8s.kubectl.create';
    }

    /**
     * @return {ObjectSchema}
     * @constructor
     */
    protected static get OPTIONS_SCHEMA() {
        return IK8sObject_JOI_SCHEMA
            .required()
            .options({
                abortEarly: true,
            });
    }

    /**
     * @param options
     * @return {Promise<void>}
     */
    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, K8s_Kubectl_ApplyObject_StationHandler.OPTIONS_SCHEMA);
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
        // create object
        return [<IReportRecord>{
            type: IReportRecordType.CMD,
            payload: {
                k8sObject: options,
                ...await this.k8sKubectlUtil.applyObject(<IK8sObject>options)
            },
        }];
    }
}
