import * as path from 'path';
import { suite, test } from 'mocha-typescript';
import {A6sRailway} from '../../lib/A6sRailway';
import {IRailwayMap} from '../../lib/interfaces/index';
import {MockResolver} from '../helpers/MockResolver';
import {MockStationHandler} from '../helpers/MockStationHandler';
import {A6sRailwayUtil} from '../../lib/utils';
import {IOC} from '../../lib/services';
const assert = require('assert');

@suite class A6s_Railway_Register_Plugin_Resolver_TestSuite {
    @test async loadFileOptions(): Promise<void> {
        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'test_station',
                options: {
                    foo: 'boo'
                },
                options_file: path.resolve('./test/resources/options.yaml'),
                resolvers: {
                    test_resolver: {
                        name: 'test_resolver',
                        options_file: path.resolve('./test/resources/options.yaml'),
                    }
                }
            }
        };

        let executed = false;
        const railway = new A6sRailway(map)
            .register(new MockStationHandler((options: object) => {
                assert.deepStrictEqual(options, {woo: 'too', foo: 'boo'});
            }, 'test_station'))
            .register(new MockResolver((sharedContext: object, options: object) => {
                assert.deepStrictEqual(options, {woo: 'too'});
                executed = true;
            }, 'test_resolver'));

        await railway.execute();

        assert(executed);
    }

    @test async registerStationHandlerPlugin(): Promise<void> {
        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'test_station',
                options: []
            }
        };

        let executed = false;
        const railway = new A6sRailway(map)
            .register(new MockStationHandler(() => {
                executed = true;
            }, 'test_station'));

        await railway.execute();

        assert(executed);
    }

    @test async registerResolverPlugin(): Promise<void> {
        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'test_station',
                resolvers: {
                    test_resolver: {
                        name: 'test_resolver',
                    }
                }
            }
        };

        let executed = false;
        const railway = new A6sRailway(map)
            .register(new MockStationHandler(() => {}, 'test_station')) // tslint:disable-line
            .register(new MockResolver((sc: {[key: string]: any}) => {
                executed = true;
                sc.test = 'foo';
            }, 'test_resolver'));

        await railway.execute();
        const sharedContext = IOC.get(A6sRailwayUtil).getSharedContext();

        assert(executed);
        assert.strictEqual(sharedContext.test, 'foo');
    }
}
