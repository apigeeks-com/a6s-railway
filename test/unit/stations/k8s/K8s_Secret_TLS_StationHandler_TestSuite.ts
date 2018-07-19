import { suite, test } from 'mocha-typescript';
import {A6sRailway} from '../../../../lib/A6sRailway';
import {IRailwayMap} from '../../../../lib/interfaces';
import {K8s_Secret_TLS_StationHandler} from '../../../../lib/stations/k8s';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {ChildProcessUtil, IOC} from '../../../../lib/services';
import {resolve} from 'path';

@suite class K8s_Secret_TLS_StationHandler_TestSuite {
    async before() {
        IOC.register(ChildProcessUtil, {
            exec: async (): Promise<{stdout: string, stderr: string, code: number}> => {
                return {
                    code: 0,
                    stderr: '',
                    stdout: '{}'
                };
            }
        });
    }

    async after() {
        IOC.unregister(ChildProcessUtil);
    }

    @test async validationPassed(): Promise<void> {
        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'k8s.tls.secret.create',
                options: {
                    name: 'foo',
                    namespace: 'boo',
                    cert: resolve('./test/unit/stations/k8s/K8s_Secret_TLS_StationHandler_TestSuite.ts'),
                    key: resolve('./test/unit/stations/k8s/K8s_Secret_TLS_StationHandler_TestSuite.ts'),
                }
            }
        };

        const railway = new A6sRailway(map)
            .register(new K8s_Secret_TLS_StationHandler());

        await railway.execute();
    }

    @test async validationFailed(): Promise<void> {
        const k8s_Secret_StationHandler = new K8s_Secret_TLS_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await k8s_Secret_StationHandler.validate({
                name: 'foo',
            });
        });
    }

    @test async emptyObjectValidationFailed(): Promise<void> {
        const k8s_Secret_StationHandler = new K8s_Secret_TLS_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await k8s_Secret_StationHandler.validate({});
        });
    }

    @test async emptyOptionValidationFailed(): Promise<void> {
        const k8s_Secret_StationHandler = new K8s_Secret_TLS_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await k8s_Secret_StationHandler.validate({
                name: 'foo',
                namespace: 'noo',
                cert: '',
                key: './test/unit/stations/k8s/K8s_Secret_TLS_StationHandler_TestSuite.ts',
            });
        });
    }
}
