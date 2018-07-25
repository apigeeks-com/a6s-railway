import { suite, test } from 'mocha-typescript';
import {IOC, ChildProcessUtil} from '../../../lib/services';
import * as path from 'path';
import {A6sRailwayUtil, ProcessReporter} from '../../../lib/services/utils';
import * as plugins from '../../../lib/stations';
import {A6sRailway} from '../../../lib/A6sRailway';
import * as fs from 'fs';
import {MockProcessReporter} from '../../helpers/MockProcessReporter';
import * as util from 'util';

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
        const a6sRailwayUtil = IOC.get(A6sRailwayUtil);
        const pathToSample = 'test/resources/success_sample/deploy.yml';

        const map = await a6sRailwayUtil.readYamlFile(path.resolve(pathToSample));
        const pwd = path.resolve(path.dirname(pathToSample));
        map.station = await a6sRailwayUtil.resolveTree(map.station, pwd);

        await this.getRailway(map).execute();
        const reference = await util.promisify(fs.readFile)('test/resources/success_deploy.json');

        assert.deepStrictEqual(JSON.parse(JSON.stringify(processReporter.getReport())), JSON.parse(reference.toString()));
    }

    @test
    async failedDeploy(): Promise<void> {
        const processReporter = IOC.get(ProcessReporter);
        const a6sRailwayUtil = IOC.get(A6sRailwayUtil);
        const pathToSample = 'test/resources/failed_deploy/deploy.yml';

        const map = await a6sRailwayUtil.readYamlFile(path.resolve(pathToSample));
        const pwd = path.resolve(path.dirname(pathToSample));
        map.station = await a6sRailwayUtil.resolveTree(map.station, pwd);

        try {
            await this.getRailway(map).execute();
            assert(false);
        } catch (e) {
            const reference = await util.promisify(fs.readFile)('test/resources/failed_deploy.json');

            assert.deepStrictEqual(JSON.parse(JSON.stringify(processReporter.getReport())), JSON.parse(reference.toString()));
        }
    }

    private getRailway(configMap: any) {
        return (new A6sRailway(configMap))
            .register([
                new plugins.A6s_Railway_ExternalFile_StationHandler(),
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
