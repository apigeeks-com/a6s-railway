import {IRailwayMap, IRailWayStation} from './interfaces';
import {BaseResolver, BaseStationHandler} from './models';
import {A6sRailwayUtil, ProcessReporter} from './services/utils';
import {IOC} from './services';
import * as path from "path";

export type A6sRailwayStationHandlersRegistry = {[name: string]: BaseStationHandler};
export type A6sRailwayResolverRegistry = {[name: string]: BaseResolver};

export class A6sRailway {
    private handlers: A6sRailwayStationHandlersRegistry;
    private resolvers: A6sRailwayResolverRegistry;
    private a6sRailwayUtil: A6sRailwayUtil;

    constructor(
        private map: IRailwayMap
    ) {
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

    /**
     * @param {BaseStationHandler | BaseResolver} entry
     * @private
     */
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
    public register(entry: BaseStationHandler | BaseResolver | BaseStationHandler[] | BaseResolver[]): A6sRailway {
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
     * @returns {Promise<IRailwayMap>}
     */
    async execute(): Promise<IRailwayMap> {
        this.map.station = await this.a6sRailwayUtil.processStation(this.map.station, this.handlers, this.resolvers);

        return this.map;
    }
}
