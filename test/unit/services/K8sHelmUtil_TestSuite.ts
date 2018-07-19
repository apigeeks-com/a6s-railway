import { suite, test } from 'mocha-typescript';
import {IOC, ChildProcessUtil, K8sHelmUtil} from '../../../lib/services';

const assert = require('assert');

let output = {
    code: 0,
    stderr: '',
    stdout: ''
};

@suite class K8sHelmUtil_TestSuite {
    private command: string;
    constructor() {
        this.command = '';
    }

    async before() {
        IOC.register(ChildProcessUtil, {
            exec: async (command: string): Promise<{stdout: string, stderr: string, code: number}> => {
                this.command = command;

                return output;
            }
        });
    }

    async after() {
        IOC.unregister(ChildProcessUtil);
        IOC.unregister(K8sHelmUtil);
    }

    @test()
    async isDeploymentExists(): Promise<void> {
        const k8sHelmUtil: K8sHelmUtil = IOC.get(K8sHelmUtil);

        output = {
            code: 0,
            stderr: '',
            stdout: 'REVISION: 1 ...',
        };

        const result = await k8sHelmUtil.isDeploymentExists('winning-shark');

        assert(result);
    }

    @test()
    async listHelmInstalled(): Promise<void> {
        const k8sHelmUtil: K8sHelmUtil = IOC.get(K8sHelmUtil);
        output = {
            code: 0,
            stderr: '',
            stdout: 'jumpy-anteater\n' + 'winning-shark\n',
        };

        const result = await k8sHelmUtil.listInstalledHelms();

        assert.deepStrictEqual(result, ['jumpy-anteater', 'winning-shark']);
    }

    @test()
    async getHelmDeployment(): Promise<void> {
        const k8sHelmUtil: K8sHelmUtil = IOC.get(K8sHelmUtil);

        output.code = 0;
        output.stderr = '';
        output.stdout = `
REVISION: 1
RELEASED: Tue May 22 09:32:30 2018
CHART: mongo-rest-0.1.0
USER-SUPPLIED VALUES:
{}

COMPUTED VALUES:
affinity: {}
image:
  pullPolicy: IfNotPresent
  repository: mongo-rest-app
  tag: v3
ingress:
  annotations: {}
  enabled: false
  hosts:
  - chart-example.local
  path: /
  tls: []
nodeSelector: {}
replicaCount: 1
resources: {}
service:
  port: 8008
  type: NodePort
tolerations: []

HOOKS:
MANIFEST:
        `;
        const result = await k8sHelmUtil.getHelmDeployment('winning-shark');

        assert.deepStrictEqual(
            {
                revision: '1',
                released: new Date('2018-05-22T06:32:30.000Z'),
                chart: 'mongo-rest-0.1.0',
                userSuppliedValues: {},
                computedValues: {
                    affinity: {},
                    image: null,
                    pullPolicy: 'IfNotPresent',
                    repository: 'mongo-rest-app',
                    tag: 'v3',
                    ingress: null,
                    annotations: {},
                    enabled: false,
                    hosts: [ 'chart-example.local' ],
                    path: '/',
                    tls: [],
                    nodeSelector: {},
                    replicaCount: 1,
                    resources: {},
                    service: null,
                    port: 8008,
                    type: 'NodePort',
                    tolerations: []
                }
            },
            result
        );
    }
}
