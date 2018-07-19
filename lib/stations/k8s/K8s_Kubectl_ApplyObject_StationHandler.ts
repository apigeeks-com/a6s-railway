import {BaseStationHandler} from '../../models';
import {IK8sObject} from '../../interfaces';
import {IOC, K8sKubectlUtil} from '../../services';
import * as Joi from 'joi';
import {IK8sObject_JOI_SCHEMA} from '../../interfaces/k8s';
import {A6sRailwayStationHandlersRegistry} from '../../A6sRailway';

export class K8s_Kubectl_ApplyObject_StationHandler extends BaseStationHandler {
    private get k8sKubectlUtil(): K8sKubectlUtil {
        return IOC.get(K8sKubectlUtil);
    }

    getName(): string {
        return'k8s.kubectl.create';
    }

    protected static get OPTIONS_SCHEMA() {
        return IK8sObject_JOI_SCHEMA
            .required()
            .options({
                abortEarly: true,
            });
    }

    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, K8s_Kubectl_ApplyObject_StationHandler.OPTIONS_SCHEMA);
        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    async run(options: any, plugins: A6sRailwayStationHandlersRegistry): Promise<void> {
        const object: IK8sObject = options;

        // create object
        await this.k8sKubectlUtil.applyObject(object);
    }
}
