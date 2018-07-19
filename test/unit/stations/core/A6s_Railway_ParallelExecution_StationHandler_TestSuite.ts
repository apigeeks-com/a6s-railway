import { suite, test } from 'mocha-typescript';
import {A6s_Railway_ParallelExecution_StationHandler} from '../../../../lib/stations';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {MockStationHandler} from '../../../helpers/MockStationHandler';

const assert = require('assert');

@suite class A6s_Railway_ParallelExecution_StationHandler_TestSuite {
    @test
    async getName(): Promise<void> {
        const station = new A6s_Railway_ParallelExecution_StationHandler();
        assert.strictEqual(station.getName(), 'a6s.parallel');
    }

    @test
    async validationFailed(): Promise<void> {
        const station = new A6s_Railway_ParallelExecution_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await station.validate(null);
        }, 'null options');

        await AssertHelper.shouldReject(async () => {
            await station.validate({});
        }, 'empty object');

        await AssertHelper.shouldReject(async () => {
            await station.validate({
                abs: 'test'
            });
        }, 'invalid type');

        await AssertHelper.shouldReject(async () => {
            await station.validate([]);
        }, 'empty array');

        await AssertHelper.shouldReject(async () => {
            await station.validate(['test']);
        }, 'invalid array item');

        await AssertHelper.shouldReject(async () => {
            await station.validate([{tst: 'test'}]);
        }, 'invalid array station');
    }

    @test
    async validationPassed(): Promise<void> {
        const station = new A6s_Railway_ParallelExecution_StationHandler();

        await AssertHelper.shouldResolve(async () => {
            await station.validate([{name: 'test'}]);
        });
    }

    @test
    async processed(): Promise<void> {
        const station = new A6s_Railway_ParallelExecution_StationHandler();
        let executed = false;
        await station.run([
            {
                name: 'st'
            }
        ], {
            st: new MockStationHandler(() => {
                executed = true;
            }, 'st')
        }, {});

        assert(executed);
    }

    @test
    async runOneFailOther(): Promise<void> {
        const station = new A6s_Railway_ParallelExecution_StationHandler();

        let executed = false;
        await AssertHelper.shouldReject(async() => {
            await station.run([
                {name: 'st.fail'},
                {name: 'st.pass'}
            ], {
                'st.fail': new MockStationHandler(() => {
                    throw new Error('fail');
                }, 'st.fail'),
                'st.pass': new MockStationHandler(async () => {
                    const promise = new Promise(resolve => {
                        setTimeout(() => {
                            executed = true;
                            resolve();
                        }, 100);
                    });

                    await promise;
                }, 'st.pass'),
            }, {});
        });

        assert(executed, 'should process second handler even first one failed');
    }

}
