import { suite, test } from 'mocha-typescript';
import {A6sRailway} from '../../lib/A6sRailway';
import {IRailwayMap} from '../../lib/interfaces';
import {A6s_Railway_SequenceExecution_StationHandler, A6s_Railway_ParallelExecution_StationHandler} from '../../lib/stations';
import {MockStationHandler} from '../helpers/MockStationHandler';
const assert = require('assert');

@suite class A6sRailway_Plugins_Loading {
    @test async corePlugins(): Promise<void> {
        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'a6s.sequence',
                options: [{
                    name: 'a6s.parallel',
                    options: [{
                        name: 'a6s.sequence',
                        options: [{
                            name: 'test_station'
                        }]
                    }]
                }]
            }
        };

        let executed = false;
        const railway = new A6sRailway(map)
            .register([
                new MockStationHandler(() => {
                    executed = true;
                }, 'test_station'),
                new A6s_Railway_ParallelExecution_StationHandler(),
                new A6s_Railway_SequenceExecution_StationHandler(),
            ]);

        await railway.execute();

        assert(executed);
    }
}
