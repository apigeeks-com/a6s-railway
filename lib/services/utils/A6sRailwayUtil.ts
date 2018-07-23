import {readFile} from 'fs';
import * as jsyaml from 'js-yaml';
import * as deepmerge from 'deepmerge';
import {IRailWayResolver, IRailWayStation} from '../../interfaces/core';
import {render} from 'ejs';
import {BaseStationHandler, BaseResolver} from '../../models';
import {A6sRailwayStationHandlersRegistry, A6sRailwayResolverRegistry} from '../../A6sRailway';
import {isAbsolute, resolve} from 'path';

export class A6sRailwayUtil {
    private sharedContext: any;

    constructor() {
        this.purgeSharedContext();
    }

    public purgeSharedContext() {
        this.sharedContext = {};
    }

    public getSharedContext() {
        return this.sharedContext;
    }

    /**
     * Get absolute file path
     * @param {string} path
     * @return {string}
     */
    getAbsolutePath(path: string): string {
        if (!isAbsolute(path)) {

            return resolve(this.getSharedContext().pwd || '.',  path);
        }

        return path;
    }

    async processStation(s: IRailWayStation, handlers: A6sRailwayStationHandlersRegistry, resolvers: A6sRailwayResolverRegistry): Promise<void> {
        const handler = handlers[s.name];

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

                const _options = await this.resolveOptionsForResolver(config, resolver);
                await resolver.run(name, _options, this.getSharedContext(), resolvers);
            }
        }

        console.log(`-> Checking if should run ${s.name}`);
        const options = await this.resolveOptionsForStationHandler(s, handler);
        const shouldRun = await handler.isShouldRun(options, handlers, resolvers);

        if (shouldRun) {
            console.log(`-> Executing ${s.name}`);
            await handler.run(options, handlers, resolvers);
        } else {
            console.log(`-> Execution skipped for ${s.name}`);
        }
    }

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

    async readYamlFile(file: string): Promise<any> {
        const yaml = await this.readStringFile(this.getAbsolutePath(file));

        return jsyaml.safeLoad(yaml);
    }

    async _resolveOptions(station: IRailWayResolver): Promise<any> {
        if (!station.options_file && !station.options) {
            return null;
        }

        if (!station.options_file && station.options) {
            return station.options;
        }

        const fileOptions = await this.readYamlFile(station.options_file);

        if (!station.options) {
            return fileOptions;
        }

        return deepmerge(fileOptions, station.options);
    }

    _processOptionsTemplate(options: any): any {
        if (options) {
            let yaml = jsyaml.dump(options);

            yaml = render(yaml, {
                env: process.env,
                context: this.getSharedContext()
            });

            options = jsyaml.safeLoad(yaml);
        }

        return options;
    }

    async resolveOptionsForResolver(config: IRailWayResolver, resolver: BaseResolver): Promise<any> {
        let options = await this._resolveOptions(config);
        options = this._processOptionsTemplate(options);


        try {
            await resolver.validate(options);
        } catch (e) {
            throw new Error(`Resolver "${resolver.getName()}" failed validation:\n${e.message}`);
        }

        return options;
    }

    async resolveOptionsForStationHandler(station: IRailWayStation, handler: BaseStationHandler): Promise<any> {
        let options = await this._resolveOptions(station);

        if (handler.isShouldProcessVariablesInOptions()) {
            options = this._processOptionsTemplate(options);
        }

        try {
            await handler.validate(options);
        } catch (e) {
            throw new Error(`Station Handler "${handler.getName()}" failed validation:\n${e.message}`);
        }

        return options;
    }
}
