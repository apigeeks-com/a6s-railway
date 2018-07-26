import { suite, test } from 'mocha-typescript';
import {A6s_Railway_SequenceExecution_StationHandler} from '../../../../lib/stations';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {MockStationHandler} from '../../../helpers/MockStationHandler';

const assert = require('assert');

@suite class A6s_Railway_SequenceExecution_StationHandler_TestSuite {
    @test
    async getName(): Promise<void> {
        const station = new A6s_Railway_SequenceExecution_StationHandler();
        assert.strictEqual(station.getName(), 'a6s.sequence');
    }

    @test
    async validationFailed(): Promise<void> {
        const station = new A6s_Railway_SequenceExecution_StationHandler();

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
        const station = new A6s_Railway_SequenceExecution_StationHandler();

        await AssertHelper.shouldResolve(async () => {
            await station.validate([{name: 'test'}]);
        });
    }

    @test
    async processed(): Promise<void> {
        const station = new A6s_Railway_SequenceExecution_StationHandler();
        let executed = false;
        await station.run(
            [
                {
                    name: 'st'
                }
            ],
            {
                st: new MockStationHandler(() => {
                    executed = true;
                }, 'st')
            },
            {},
            []
        );

        assert(executed);
    }

}
