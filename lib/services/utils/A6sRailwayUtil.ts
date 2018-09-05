import {readFile} from 'fs';
import chalk from 'chalk';
import * as jsyaml from 'js-yaml';
import * as deepmerge from 'deepmerge';
import {resolve, isAbsolute} from 'path';
import {IRailWayResolver, IRailWayStation} from '../../interfaces/core';
import {render} from 'ejs';
import {BaseStationHandler, BaseResolver, StationContext} from '../../models';
import {A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../../A6sRailway';
import {ProcessReporter} from './';
import {IOC} from '../';
import {IHandlerReport} from '../../interfaces';
import {homedir} from 'os';
import {ParallelProcessingException, StationException, ProcessExceptionType} from '../../exception';

const ejsLint = require('ejs-lint');

export class A6sRailwayUtil {
    private sharedContext: any;
    private handlerIndex = 0;

    constructor() {
        this.purgeSharedContext();
    }

    /**
     * Get ProcessReporter service
     *
     * @return {ProcessReporter}
     */
    private get processReporter(): ProcessReporter {
        return IOC.get(ProcessReporter);
    }

    /**
     * Clearing shared context
     */
    public purgeSharedContext() {
        this.sharedContext = {};
    }

    /**
     * Get shared context
     * @return {any}
     */
    public getSharedContext() {
        return this.sharedContext;
    }

    /**
     * Get absolute file path
     * @param {string} path
     * @param {string} workingDirectory
     * @return {string}
     */
    getAbsolutePath(path: string, workingDirectory?: string): string {
        if (path.indexOf('~') === 0) {
            return resolve(homedir(), path.replace('~/', ''))
        }


        if (!isAbsolute(path)) {
            return resolve(workingDirectory || '.',  path);
        }

        return path;
    }

    /**
     * Processed Station
     *
     * @param {IRailWayStation} s
     * @param {A6sRailwayStationHandlersRegistry} handlers
     * @param {A6sRailwayResolverRegistry} resolvers
     * @param {StationContext} stationContext
     * @return {Promise<IRailWayStation>}
     */
    async processStation(
        s: IRailWayStation,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry,
        stationContext: StationContext,
    ): Promise<IRailWayStation> {
        stationContext.addParent(`${s.name}${this.handlerIndex++}`);

        try {
            return await this._processStation(s, handlers, resolvers, stationContext);
        } catch (e) {
            let exceptions = [];

            if (e instanceof ParallelProcessingException) {
                exceptions = e.getExceptions();
            } else {
                exceptions = [e];
            }

            const errors = exceptions
                .map((exception: Error) => {
                    if (exception instanceof StationException) {
                        return {
                            exception: exception.message,
                            type: exception.type,
                            payload: exception.payload,
                        };
                    }

                    return undefined;
                })
                .filter(exception => !!exception)
            ;

            this.processReporter.registerHandler(
                stationContext.getParentsPath(),
                s,
                {
                    error: errors.length ? errors : undefined,
                }
            );

            throw new Error(e.message);
        }
    }

    /**
     * Read File
     *
     * @param {string} file
     * @return {Promise<string>}
     */
    readStringFile(file: string): Promise<string> {
        return new Promise<any>((res, rej) => {
            readFile(file, 'utf8', (err, str) => {
                if (err) {
                    return rej(err);
                }

                res(str);
            });
        });
    }

    /**
     * Read Yaml file
     *
     * @param {string} file
     * @return {Promise<any>}
     */
    async readYamlFile(file: string): Promise<any> {
        const yaml = await this.readStringFile(file);

        return jsyaml.safeLoad(yaml);
    }

    /**
     * Resolving options
     *
     * @param {IRailWayResolver} station
     * @param {StationContext} stationContext
     * @return {Promise<any>}
     * @private
     */
    async _resolveOptions(station: IRailWayResolver, stationContext: StationContext): Promise<any> {
        if (!station.options_file && !station.options) {
            return null;
        }

        if (!station.options_file && station.options) {
            return station.options;
        }

        const fileOptions = await this.readYamlFile(
            this.getAbsolutePath(station.options_file, stationContext.getWorkingDirectory())
        );

        if (!station.options) {
            return fileOptions;
        }

        return deepmerge(fileOptions, station.options);
    }

    /**
     * Build template in options
     *
     * @param options
     * @return {any}
     * @private
     */
    _processOptionsTemplate(options: any): any {
        if (options) {
            let yaml = jsyaml.dump(options);

            try {
                // validate template
                ejsLint(yaml);

                yaml = render(yaml, {
                    env: process.env,
                    context: this.getSharedContext()
                });
            } catch (e) {
                throw new StationException(
                    e.message,
                    ProcessExceptionType.TEMPLATE,
                );
            }

            options = jsyaml.safeLoad(yaml);
        }

        return options;
    }

    /**
     * Resolve options for resolver
     *
     * @param {IRailWayResolver} config
     * @param {BaseResolver} resolver
     * @param {StationContext} stationContext
     * @return {Promise<any>}
     */
    async resolveOptionsForResolver(
        config: IRailWayResolver,
        resolver: BaseResolver,
        stationContext: StationContext
    ): Promise<any> {
        let options = await this._resolveOptions(config, stationContext);
        options = this._processOptionsTemplate(options);

        try {
            await resolver.validate(options);
        } catch (e) {
            throw new StationException(
                `Resolver "${resolver.getName()}" failed validation:\n${e.message}`,
                ProcessExceptionType.VALIDATION,
            );
        }

        return options;
    }

    /**
     * Resolve options for station handler
     *
     * @param {IRailWayStation} station
     * @param {BaseStationHandler} handler
     * @param {StationContext} stationContext
     * @return {Promise<any>}
     */
    async resolveOptionsForStationHandler(
        station: IRailWayStation,
        handler: BaseStationHandler,
        stationContext: StationContext
    ): Promise<any> {
        let options = await this._resolveOptions(station, stationContext);

        if (handler.isShouldProcessVariablesInOptions()) {
            options = this._processOptionsTemplate(options);
        }

        try {
            await handler.validate(options);
        } catch (e) {
            throw new StationException(
                `Station Handler "${handler.getName()}" failed validation:\n${e.message}`,
                ProcessExceptionType.VALIDATION,
            );
        }

        return options;
    }

    /**
     * Processed Station
     *
     * @param {IRailWayStation} s
     * @param {A6sRailwayStationHandlersRegistry} handlers
     * @param {A6sRailwayResolverRegistry} resolvers
     * @param {StationContext} stationContext
     * @return {Promise<IRailWayStation>}
     */
    private async _processStation(
        s: IRailWayStation,
        handlers: A6sRailwayStationHandlersRegistry,
        resolvers: A6sRailwayResolverRegistry,
        stationContext: StationContext,
    ): Promise<IRailWayStation> {
        const handler = handlers[s.name];
        const result = <IHandlerReport>{
            resolvers: [],
            handler: null,
        };

        if (!handler) {
            throw new Error(`Unable to execute deployment. Plugin "${s.name}" is not registered`);
        }

        if (s.resolvers) {
            for (const name in s.resolvers) {
                const config: IRailWayResolver = s.resolvers[name];
                const resolver = resolvers[config.name];

                if (!resolver) {
                    throw new Error(`Unable to execute deployment. Resolver "${config.name}" is not registered`);
                }

                const _options = await this.resolveOptionsForResolver(config, resolver, stationContext);
                const resolverResult = await resolver.run(name, _options, this.getSharedContext(), resolvers);

                if (resolverResult) {
                    result.resolvers.push(resolverResult);
                }
            }
        }

        const level = stationContext.getParentsPath().map(p => '  ').join('');

        console.log(chalk.yellow(`${level} Checking if should run ${chalk.green(s.name)}`));

        const options = await this.resolveOptionsForStationHandler(s, handler, stationContext);
        const shouldRun = await handler.isShouldRun(options, handlers, resolvers);

        this.processReporter.registerHandler(stationContext.getParentsPath(), s, result, options);

        if (shouldRun) {
            console.log(chalk.yellow(`${level} Executing ${chalk.green(s.description || s.name)}`));

            const handlerResult = await handler.run(options, handlers, resolvers, stationContext);

            if (handlerResult) {
                result.handler = handlerResult;
            }
        } else {
            console.log(chalk.blue(`${level} Execution skipped for ${chalk.green(s.description || s.name)}`));
        }



        return s;
    }
}
