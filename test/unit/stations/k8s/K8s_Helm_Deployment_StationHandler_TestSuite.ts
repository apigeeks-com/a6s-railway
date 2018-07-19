import { suite, test } from 'mocha-typescript';
import {A6sRailway} from '../../../../lib/A6sRailway';
import {IRailwayMap} from '../../../../lib/interfaces';
import {K8s_Helm_Deployment_StationHandler} from '../../../../lib/stations/k8s';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {ChildProcessUtil, IOC} from '../../../../lib/services';

@suite class K8s_Helm_Deployment_StationHandler_TestSuite {
    async before() {
        IOC.register(ChildProcessUtil, {
            exec: async (): Promise<{stdout: string, stderr: string, code: number}> => {
                return {
                    code: 0,
                    stderr: '',
                    stdout: ''
                };
            }
        });
    }

    async after() {
        IOC.unregister(ChildProcessUtil);
    }

    @test async validationPassed(): Promise<void> {
        const k8s_Helm_Deployment_StationHandler = new K8s_Helm_Deployment_StationHandler();

        await k8s_Helm_Deployment_StationHandler.validate({
            name: 'foo',
            namespace: 'boo',
            chart: 'foo',
            version: 'v1',
            variables: [],
            variable_files: [],
            wait: true,
            timeout: 10
        });
    }

    @test async validationFailed(): Promise<void> {
        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'k8s.helm.install',
                options: {
                    version: 'v1',
                    variables: [],
                    variable_files: [],
                    wait: true,
                    timeout: 10
                }
            }
        };

        const railway = new A6sRailway(map)
            .register(new K8s_Helm_Deployment_StationHandler());

        await AssertHelper.shouldReject(async () => {
            await railway.execute();
        });
    }
}
