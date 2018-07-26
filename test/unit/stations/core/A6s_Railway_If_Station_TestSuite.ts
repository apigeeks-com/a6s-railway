import { suite, test } from 'mocha-typescript';
import {A6s_Railway_If_StationHandler} from '../../../../lib/stations';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {MockStationHandler} from '../../../helpers/MockStationHandler';

const assert = require('assert');

@suite class A6s_Railway_If_Station_TestSuite {
    @test
    async getName(): Promise<void> {
        const station = new A6s_Railway_If_StationHandler();
        assert.strictEqual(station.getName(), 'a6s.if');
    }

    @test
    async validationFailed(): Promise<void> {
        const station = new A6s_Railway_If_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await station.validate(null);
        }, 'null options');


        await AssertHelper.shouldReject(async () => {
            await station.validate({});
        }, 'empty object');

        await AssertHelper.shouldReject(async () => {
            await station.validate({
                test: 'abc'
            });
        }, 'invalid schema');

        await AssertHelper.shouldReject(async () => {
            await station.validate({
                test: 'abc',
                equals: 'equals',
                station: {
                    abc: 'test'
                }
            });
        }, 'invalid station schema');
    }

    @test
    async validationPassed(): Promise<void> {
        const station = new A6s_Railway_If_StationHandler();

        await AssertHelper.shouldResolve(async () => {
            await station.validate({
                value: 'value',
                equals: 'equals',
                station: {
                    name: 'test'
                }
            });
        });
    }

    @test
    async processed(): Promise<void> {
        const station = new A6s_Railway_If_StationHandler();
        let executed = false;
        await station.run({
            value: 'test',
            equals: 'test',
            station: {
                name: 'st'
            }
        }, {
            st: new MockStationHandler(() => {
                executed = true;
            })
        }, {}, []);

        assert(executed);
    }

    @test
    async skipped(): Promise<void> {
        const station = new A6s_Railway_If_StationHandler();
        let executed = false;
        await station.run({
            value: 'test',
            equals: 'test2',
            station: {
                name: 'st'
            }
        }, {
            st: new MockStationHandler(() => {
                executed = true;
            })
        }, {}, []);

        assert(!executed);
    }
}
