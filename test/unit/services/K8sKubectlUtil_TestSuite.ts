import { suite, test } from 'mocha-typescript';
import {IOC} from '../../../lib/services';
import {ChildProcessUtil} from '../../../lib/utils';
import {K8sKubectlUtil} from '../../../lib/utils';
import {IK8sObject} from '../../../lib/interfaces/k8s';
import {readFileSync} from 'fs';
import * as jsyaml from 'js-yaml';
import {AssertHelper} from '../../helpers/AssertHelper';

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
    }

    after() {
        IOC.unregister(ChildProcessUtil);
        IOC.unregister(K8sKubectlUtil);
    }

    @test
    async getObject_NotFound(): Promise<void> {
        const k8sKubectlUtil: K8sKubectlUtil = IOC.get(K8sKubectlUtil);

        this.result.code = 1;
        this.result.stderr = 'Error from server (NotFound): storageclasses.storage.k8s.io "test" not found';
        this.result.stdout = '';

        const result = await k8sKubectlUtil.getObject(<IK8sObject> {
            kind: 'StorageClass',
            metadata: {
                name: 'test'
            }
        });

        assert.strictEqual(result, null);
    }

    @test
    async getObject_Error(): Promise<void> {
        const k8sKubectlUtil: K8sKubectlUtil = IOC.get(K8sKubectlUtil);

        this.result.code = 1;
        this.result.stderr = '';
        this.result.stdout = '';

        await AssertHelper.shouldReject(async () => {
            await k8sKubectlUtil.getObject(<IK8sObject> {
                kind: 'StorageClass',
                metadata: {
                    name: 'test'
                }
            });
        });
    }

    @test
    async getObject_Found(): Promise<void> {
        const k8sKubectlUtil: K8sKubectlUtil = IOC.get(K8sKubectlUtil);

        this.result.code = 0;
        this.result.stderr = '';
        this.result.stdout = JSON.stringify({
            'apiVersion': 'storage.k8s.io/v1',
            'kind': 'StorageClass',
            'metadata': {
                'creationTimestamp': '2018-06-06T11:15:39Z',
                'name': 'test',
                'resourceVersion': '1154250',
                'selfLink': '/apis/storage.k8s.io/v1/storageclasses/minio-sc',
                'uid': 'f1c4f846-697a-11e8-b2d7-067482840ca4'
            },
            'parameters': {
                'iopsPerGB': '10',
                'type': 'gp2',
                'zones': 'ap-southeast-2a'
            },
            'provisioner': 'kubernetes.io/aws-ebs',
            'reclaimPolicy': 'Delete',
            'volumeBindingMode': 'Immediate'
        });

        const result = await k8sKubectlUtil.getObject(<IK8sObject> {
            kind: 'StorageClass',
            metadata: {
                name: 'test'
            }
        });

        assert.strictEqual(result.metadata.name, 'test');
    }

    @test()
    async createObject(): Promise<void> {
        const k8sKubectlUtil: K8sKubectlUtil = IOC.get(K8sKubectlUtil);

        this.result.code = 0;
        this.result.stderr = '';
        this.result.stdout = '';

        const obj = <IK8sObject> {
            kind: 'StorageClass',
            metadata: {
                name: 'test'
            }
        };

        await k8sKubectlUtil.createObject(obj);

        const file = this.command.split(' ').pop();
        const content = readFileSync(file, 'utf8');

        assert.strictEqual(content, jsyaml.dump(obj));
    }

    @test()
    async deleteObject(): Promise<void> {
        const k8sKubectlUtil: K8sKubectlUtil = IOC.get(K8sKubectlUtil);

        this.result.code = 0;
        this.result.stderr = '';
        this.result.stdout = 'storageclass.storage.k8s.io "foo" deleted';

        const obj = <IK8sObject> {
            kind: 'StorageClass',
            apiVersion: 'storage.k8s.io/v1',
            metadata: {
                name: 'foo',
            },
            provisioner: 'kubernetes.io/aws-ebs',
        };

        assert.strictEqual(this.result.stdout, await k8sKubectlUtil.deleteObject(obj));
    }

    @test()
    async notFoundDeleteObject(): Promise<void> {
        const k8sKubectlUtil: K8sKubectlUtil = IOC.get(K8sKubectlUtil);

        this.result.code = 1;
        this.result.stderr = 'Error from server (NotFound): storageclasses.storage.k8s.io "foo" not found';
        this.result.stdout = '';

        let result;

        try {
            await k8sKubectlUtil.deleteObject(<IK8sObject> {
                kind: 'StorageClass',
                apiVersion: 'storage.k8s.io/v1',
                metadata: {
                    name: 'foo',
                },
                provisioner: 'kubernetes.io/aws-ebs',
            });
        } catch (e) {
            result = e.message;
        }

        assert(result.indexOf('Error from server (NotFound)') > -1);
    }

    @test()
    async errorDeleteObject(): Promise<void> {
        const k8sKubectlUtil: K8sKubectlUtil = IOC.get(K8sKubectlUtil);

        this.result.code = 1;
        this.result.stderr = '';
        this.result.stdout = '';

        const obj = <IK8sObject> {
            kind: 'StorageClass',
            apiVersion: 'storage.k8s.io/v1',
            metadata: {
                name: 'foo',
            },
            provisioner: 'kubernetes.io/aws-ebs',
        };

        await AssertHelper.shouldReject(async () => {
            await k8sKubectlUtil.deleteObject(obj);
        });
    }
}
