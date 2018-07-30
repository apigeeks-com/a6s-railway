import {IRailwayMap} from './interfaces';
import {BaseResolver, BaseStationHandler, StationContext} from './models';
import {A6sRailwayUtil} from './services/utils';
import {IOC} from './services';
import {dirname} from 'path';
import {ProcessException, ProcessExceptionType} from './exception';

export type A6sRailwayStationHandlersRegistry = {[name: string]: BaseStationHandler};
export type A6sRailwayResolverRegistry = {[name: string]: BaseResolver};

export class A6sRailway {

    private handlers: A6sRailwayStationHandlersRegistry;
    private resolvers: A6sRailwayResolverRegistry;

    private map: IRailwayMap;
    private mapFile: string;
    private a6sRailwayUtil: A6sRailwayUtil;

    constructor(
        map: IRailwayMap | string,
        private stationContext?: StationContext,
    ) {
        if (typeof map === 'string') {
            this.mapFile = map;
        } else {
            this.map = map;
        }

        if (!this.stationContext) {
            this.stationContext = new StationContext();
        }

        this.handlers = {};
        this.resolvers = {};
        this.a6sRailwayUtil = IOC.get(A6sRailwayUtil);
    }

    /**
     * Override plugins
     * @param {A6sRailwayStationHandlersRegistry} handlers
     * @returns {A6sRailway}
     */
    public setHandlers(handlers: A6sRailwayStationHandlersRegistry): A6sRailway {
        this.handlers = handlers;

        return this;
    }

    /**
     * Override resolvers
     *
     * @param {A6sRailwayResolverRegistry} resolvers
     * @return {A6sRailway}
     */
    public setResolvers(resolvers: A6sRailwayResolverRegistry): A6sRailway {
        this.resolvers = resolvers;

        return this;
    }

    private _register(entry: BaseStationHandler | BaseResolver) {
        if (entry instanceof BaseStationHandler) {
            this.handlers[entry.getName()] = entry;
        }

        if (entry instanceof BaseResolver) {
            this.resolvers[entry.getName()] = entry;
        }
    }

    /**
     * Register one or many plugins/resolvers at once
     * @param {BaseStationHandler | BaseResolver | BaseStationHandler[] | BaseResolver[]} entry
     * @returns {A6sRailway}
     */
    public register(entry: BaseStationHandler | BaseResolver | Array<BaseStationHandler | BaseResolver>): A6sRailway {
        if (Array.isArray(entry)) {
            for (const i in entry) {
                this._register(entry[i]);
            }
        } else {
            this._register(entry);
        }

        return this;
    }

    /**
     * Execute pipeline
     * @returns {Promise<A6sRailway>}
     */
    async execute(): Promise<A6sRailway> {
        let workingDirectory = this.stationContext.getWorkingDirectory();

        if (!this.map) {
            try {
                this.map = await this.a6sRailwayUtil.readYamlFile(
                    this.a6sRailwayUtil.getAbsolutePath(this.mapFile, workingDirectory)
                );
                workingDirectory = dirname(this.mapFile);
            } catch (e) {
                throw new ProcessException(e.message, ProcessExceptionType.NOT_FOUNT);
            }
        }

        // execute
        await this.a6sRailwayUtil.processStation(
            this.map.station,
            this.handlers,
            this.resolvers,
            new StationContext(this.stationContext.getParentsPath(), workingDirectory)
        );

        return this;
    }
}
