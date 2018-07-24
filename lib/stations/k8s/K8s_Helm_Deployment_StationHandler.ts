import {BaseStationHandler} from '../../models';
import {IHelmChartInstall, IReportRecord, TypeRecord} from '../../interfaces';
import {K8sHelmUtil} from '../../services/utils';
import {IOC} from '../../services';
import * as Joi from 'joi';
import {IHelmChartInstall_JOI_SCHEMA} from '../../interfaces/k8s';
import {A6sRailwayStationHandlersRegistry} from '../../A6sRailway';

export class K8s_Helm_Deployment_StationHandler extends BaseStationHandler {
    /**
     * @return {K8sHelmUtil}
     */
    private get k8sHelmUtil(): K8sHelmUtil {
        return IOC.get(K8sHelmUtil);
    }

    /**
     * @param options
     * @return {Promise<void>}
     */
    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, IHelmChartInstall_JOI_SCHEMA);

        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    /**
     * @return {string}
     */
    getName(): string {
        return 'k8s.helm.install';
    }

    /**
     * @param options
     * @param {A6sRailwayStationHandlersRegistry} handlers
     * @return {Promise<IReportRecord[]>}
     */
    async run(options: any, handlers: A6sRailwayStationHandlersRegistry): Promise<IReportRecord[]> {
        return [<IReportRecord>{
            type: TypeRecord.CMD,
            payload: await this.k8sHelmUtil.updateOrInstall(options as IHelmChartInstall),
        }];
    }
}
