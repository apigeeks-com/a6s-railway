import { suite, test } from 'mocha-typescript';
import {A6s_Railway_ExternalFile_StationHandler} from '../../../../lib/stations';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {MockStationHandler} from '../../../helpers/MockStationHandler';
import {writeFileSync} from 'fs';

const assert = require('assert');
const tmp = require('tmp-promise');

@suite class A6s_Railway_ExternalFile_StationHandler_TestSuite {
    @test
    async getName(): Promise<void> {
        const station = new A6s_Railway_ExternalFile_StationHandler();
        assert.strictEqual(station.getName(), 'a6s.external');
    }

    @test
    async validationFailed(): Promise<void> {
        const station = new A6s_Railway_ExternalFile_StationHandler();

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
    }

    @test
    async validationPassed(): Promise<void> {
        const station = new A6s_Railway_ExternalFile_StationHandler();

        await AssertHelper.shouldResolve(async () => {
            await station.validate({
                file: '/tpm/test.yml'
            });
        });
    }

    @test
    async failOnMissingFile(): Promise<void> {
        const station = new A6s_Railway_ExternalFile_StationHandler();

        const tmpFile = await tmp.file();

        await AssertHelper.shouldReject(async () => {
            await station.run({
                file: tmpFile + '.err'
            }, {}, {});
        });
    }

    @test
    async processed(): Promise<void> {
        const station = new A6s_Railway_ExternalFile_StationHandler();

        const tmpFile = await tmp.file();
        const tmpFilePath = tmpFile.path;

        writeFileSync(tmpFilePath, [
            'version: 1.0.0',
            'station:',
            '  name: st'
        ].join('\n'));

        let executed = false;
        await station.run({
            file: tmpFilePath
        }, {
            st: new MockStationHandler(() => {
                executed = true;
            }, 'st')
        }, {});

        assert(executed);
    }
}
