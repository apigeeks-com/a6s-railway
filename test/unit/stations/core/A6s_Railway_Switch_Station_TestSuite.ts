import { suite, test } from 'mocha-typescript';
import {A6s_Railway_Switch_StationHandler} from '../../../../lib/stations';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {MockStationHandler} from '../../../helpers/MockStationHandler';

const assert = require('assert');


@suite class A6s_Railway_Switch_Station_TestSuite {
    @test
    async getName(): Promise<void> {
        const station = new A6s_Railway_Switch_StationHandler();
        assert.strictEqual(station.getName(), 'a6s.switch');
    }

    @test
    async validationFailed(): Promise<void> {
        const station = new A6s_Railway_Switch_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await station.validate(null);
        }, 'null options');

        await AssertHelper.shouldReject(async () => {
            await station.validate({});
        }, 'empty object');

        await AssertHelper.shouldReject(async () => {
            await station.validate({
                value: 'value'
            });
        }, 'missing field');

        await AssertHelper.shouldReject(async () => {
            await station.validate({
                value: 'value',
                switch: 'test'
            });
        }, 'invalid switch type');

        await AssertHelper.shouldReject(async () => {
            await station.validate({
                value: 'value',
                switch: {
                    test: 'test'
                }
            });
        }, 'invalid switch case option type');

        await AssertHelper.shouldReject(async () => {
            await station.validate({
                value: 'value',
                switch: {
                    test: {
                        value: 'a'
                    }
                }
            });
        }, 'invalid station schema');
    }

    @test
    async validationPassed(): Promise<void> {
        const station = new A6s_Railway_Switch_StationHandler();
        await AssertHelper.shouldResolve(async () => {
            await station.validate({
                value: 'value',
                switch: {
                    test_value: {
                        name: 'test'
                    }
                }
            });
        });
    }

    @test
    async processed(): Promise<void> {
        const station = new A6s_Railway_Switch_StationHandler();
        let executed = false;
        await station.run({
            value: 'test',
            switch: {
                test: {
                    name: 'st'
                }
            }
        }, {
            st: new MockStationHandler(() => {
                executed = true;
            }, 'st')
        }, {});

        assert(executed);
    }

    @test
    async skipped(): Promise<void> {
        const station = new A6s_Railway_Switch_StationHandler();
        let executed = false;
        await station.run({
            value: 'test',
            switch: {
                test2: {
                    name: 'st'
                }
            }
        }, {
            st: new MockStationHandler(() => {
                executed = true;
            })
        }, {});

        assert(!executed);
    }
}
