import { suite, test } from 'mocha-typescript';
import {ShellCmdStdOutResolver} from '../../../lib/resolvers/ShellCmdStdOutResolver';

const assert = require('assert');

@suite class ShellCmdStdOutResolver_TestSuite {
    @test
    async getName(): Promise<void> {
        const resolver = new ShellCmdStdOutResolver();
        assert.strictEqual(resolver.getName(), 'a6s.shell.cmd.stdout');
    }

    @test
    async validationFailed(): Promise<void> {
        const resolver = new ShellCmdStdOutResolver();
        let error = null;
        try {
            await resolver.validate({
                test: 'abc'
            });
        } catch (e) {
            error = e;
        }

        assert(error != null);
    }

    @test
    async validationPassed(): Promise<void> {
        const resolver = new ShellCmdStdOutResolver();
        let error = null;
        try {
            await resolver.validate({
                cmd: 'echo "test"'
            });
        } catch (e) {
            error = e;
        }

        assert(error == null);
    }

    @test
    async runSuccessfully(): Promise<void> {
        const resolver = new ShellCmdStdOutResolver();
        const context: any = {};
        await resolver.run('var', { cmd: 'echo "test"' }, context, {});
        assert.strictEqual(context.var, 'test');
    }

    @test
    async runFailure(): Promise<void> {
        const resolver = new ShellCmdStdOutResolver();
        const context: any = {};

        let error = null;
        try {
            await resolver.run('var', { cmd: 'non_existing_command "test"' }, context, {});
        } catch (e) {
            error = e;
        }

        assert(error != null);
    }
}
