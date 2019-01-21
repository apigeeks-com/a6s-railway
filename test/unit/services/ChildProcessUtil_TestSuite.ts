import { suite, test } from 'mocha-typescript';
import {IOC} from '../../../lib/services';
import {ChildProcessUtil} from '../../../lib/utils';

const assert = require('assert');

@suite class ChildProcessUtil_TestSuite {
    @test
    async executeSuccessful(): Promise<void> {
        const childProcess: ChildProcessUtil = IOC.get(ChildProcessUtil);
        const result = await childProcess.exec('echo "test"');
        assert.strictEqual(result.stdout, 'test');
        assert.strictEqual(result.stderr, '');
        assert(result.code === 0);
    }

    @test
    async executeFailure(): Promise<void> {
        const childProcess: ChildProcessUtil = IOC.get(ChildProcessUtil);
        const result = await childProcess.exec('bash -c \'exit 1\'');
        assert.strictEqual(result.stdout.trim(), '', 'stdout not empty');
        assert.strictEqual(result.stderr.trim(), '', 'stderr not empty');
        assert(result.code > 0, `code is not greater than 0, but: ${result.code}`);
    }
}
