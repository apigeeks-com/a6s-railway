import { suite, test } from 'mocha-typescript';
import {A6sRailway} from '../../../../lib/A6sRailway';
import {IRailwayMap} from '../../../../lib/interfaces';
import {K8s_Kubectl_ApplyObject_StationHandler} from '../../../../lib/stations/k8s';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {IOC} from '../../../../lib/services';
import {ChildProcessUtil} from '../../../../lib/utils';

let output = {
    code: 0,
    stderr: '',
    stdout: ''
};

@suite class K8s_Kubectl_ApplyObject_StationHandler_TestSuite {
    async before() {
        IOC.register(ChildProcessUtil, {
            exec: async (): Promise<{stdout: string, stderr: string, code: number}> => {
                return output;
            }
        });
    }

    async after() {
        IOC.unregister(ChildProcessUtil);
    }

    @test async registerPassed(): Promise<void> {
        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'k8s.kubectl.create',
                options: {
                    kind: 'StorageClass',
                    apiVersion: 'storage.k8s.io/v1',
                    metadata: {
                        name: 'foo',
                    },
                    provisioner: 'kubernetes.io/aws-ebs',
                }
            }
        };

        output = {
            code: 0,
            stderr: '',
            stdout: JSON.stringify({
                apiVersion: 'storage.k8s.io/v1',
                kind: 'StorageClass',
                metadata: {
                    creationTimestamp: '2018-06-06T11:15:39Z',
                    name: 'test',
                    resourceVersion: '1154250',
                    selfLink: '/apis/storage.k8s.io/v1/storageclasses/minio-sc',
                    uid: 'f1c4f846-697a-11e8-b2d7-067482840ca4'
                },
                parameters: {
                    iopsPerGB: '10',
                    type: 'gp2',
                    zones: 'ap-southeast-2a'
                },
                provisioner: 'kubernetes.io/aws-ebs',
                reclaimPolicy: 'Delete',
                volumeBindingMode: 'Immediate'
            })
        };

        const railway = new A6sRailway(map)
            .register(new K8s_Kubectl_ApplyObject_StationHandler());

        await railway.execute();
    }

    @test async validationPassed(): Promise<void> {
        const k8s_Kubectl_CreateObject_StationHandler = new K8s_Kubectl_ApplyObject_StationHandler();

        await AssertHelper.shouldResolve(async () => {
            await k8s_Kubectl_CreateObject_StationHandler.validate({
                kind: 'StorageClass',
                apiVersion: 'storage.k8s.io/v1',
                metadata: {
                    name: 'foo',
                },
                provisioner: 'kubernetes.io/aws-ebs',
            });
        });
    }

    @test async validationFailed(): Promise<void> {
        const k8s_Kubectl_CreateObject_StationHandler = new K8s_Kubectl_ApplyObject_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await k8s_Kubectl_CreateObject_StationHandler.validate({
                apiVersion: 'storage.k8s.io/v1',
                metadata: {
                    name: 'foo',
                }
            });
        });
    }
}
