import {BaseStationHandler, StationContext} from '../../models';
import {IHelmChartInstall, IReportRecord, IReportRecordType} from '../../interfaces';
import {K8sHelmUtil} from '../../utils';
import {IOC} from '../../services';
import * as Joi from 'joi';
import {IHelmChartInstall_JOI_SCHEMA} from '../../interfaces/k8s';
import {A6sRailwayResolverRegistry, A6sRailwayStationHandlersRegistry} from '../../A6sRailway';

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
        return [<IReportRecord>{
            type: IReportRecordType.CMD,
            payload: await this.k8sHelmUtil.updateOrInstall(
                options as IHelmChartInstall,
                stationContext.getWorkingDirectory()
            ),
        }];
    }
}
