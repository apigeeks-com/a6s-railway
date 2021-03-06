import {A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../A6sRailway';
import {IReportRecord} from '../interfaces';
import {StationContext} from './index';

export abstract class BaseStationHandler {
    /**
     * Get plugin name
     * @returns {string}
     */
    abstract getName(): string;

    /**
     * Check if variables inside options needs to be resolved
     * Generally plugins that control the flow should not resolve options as level down options will be resolved on the top level plugin.
     * @returns {boolean}
     */
    isShouldProcessVariablesInOptions(): boolean  {
        return true;
    }

    /**
     * Validate options before processing
     * @param options
     * @returns {Promise<void>}
     */
    async validate(options: any): Promise<void> {} // tslint:disable-line

    /**
     * Check if run should be executed
     * @param options
     * @param handlers
     * @param resolvers
     * @returns {Promise<boolean>}
     */
    async isShouldRun(options: any, handlers: A6sRailwayStationHandlersRegistry, resolvers: A6sRailwayResolverRegistry): Promise<boolean> {
        return true;
    }

    /**
     * Run plugin
     * @param options
     * @param handlers
     * @param resolvers
     * @param stationContext
     * @returns {Promise<void>}
     */
    async run(
        options: any,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry,
        stationContext: StationContext,
    ): Promise<IReportRecord[] | void> {} // tslint:disable-line
}
