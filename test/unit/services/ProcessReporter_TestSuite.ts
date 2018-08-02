import { suite, test } from 'mocha-typescript';
import {IOC, ChildProcessUtil} from '../../../lib/services';
import * as path from 'path';
import {ProcessReporter} from '../../../lib/services/utils';
import * as plugins from '../../../lib/stations';
import {A6sRailway} from '../../../lib/A6sRailway';
import * as fs from 'fs';
import {MockProcessReporter} from '../../helpers/MockProcessReporter';
import * as util from 'util';
import {MockA6sRailwayExternalFileStationHandler} from '../../helpers/MockA6sRailwayExternalFileStationHandler';

const assert = require('assert');

@suite class K8sKubectlUtil_TestSuite {
    private result: {stdout: string, stderr: string, code: number};
    private command: string;
    constructor() {
        this.command = '';
        this.result = {
            code: 0,
            stderr: '',
            stdout: ''
        };
    }

    before() {
        IOC.register(ChildProcessUtil, {
            exec: async (command: string): Promise<{stdout: string, stderr: string, code: number}> => {
                this.command = command;

                return this.result;
            }
        });

        IOC.register(ProcessReporter, new MockProcessReporter());
    }

    after() {
        IOC.unregister(ChildProcessUtil);
    }

    @test
    async successDeploy(): Promise<void> {
        const processReporter = IOC.get(ProcessReporter);

        await this.getRailway(path.resolve('test/resources/success_sample/deploy.yml')).execute();
        const reference = await util.promisify(fs.readFile)('test/resources/success_deploy.json');

        assert.deepStrictEqual(JSON.parse(JSON.stringify(processReporter.getReport())), JSON.parse(reference.toString()));
    }

    @test
    async failedDeploy(): Promise<void> {
        const processReporter = IOC.get(ProcessReporter);

        try {
            await this.getRailway(path.resolve('test/resources/failed_deploy/deploy.yml')).execute();
            assert(false);
        } catch (e) {
            const reference = await util.promisify(fs.readFile)('test/resources/failed_deploy.json');

            assert.deepStrictEqual(JSON.parse(JSON.stringify(processReporter.getReport())), JSON.parse(reference.toString()));
        }
    }

    private getRailway(configMap: any) {
        return (new A6sRailway(configMap))
            .register([
                new MockA6sRailwayExternalFileStationHandler(),
                new plugins.A6s_Railway_ParallelExecution_StationHandler(),
                new plugins.A6s_Railway_SequenceExecution_StationHandler(),
                new plugins.K8s_Helm_Deployment_StationHandler(),
                new plugins.K8s_Kubectl_ApplyObject_StationHandler(),
                new plugins.K8s_ConfigMap_StationHandler(),
                new plugins.K8s_Secret_Docker_Registry_StationHandler(),
                new plugins.K8s_Secret_Generic_StationHandler(),
            ])
        ;
    }
}
