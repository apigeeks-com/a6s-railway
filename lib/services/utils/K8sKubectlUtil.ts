import {IK8sObject, IProcessResult} from '../../interfaces';
import * as jsyaml from 'js-yaml';
import {ChildProcessUtil, A6sRailwayUtil} from './';
import {IOC} from '../IOC';
import {createHash} from 'crypto';
import {StationException, ProcessExceptionType} from '../../exception';

const tmp = require('tmp-promise');
const fs = require('fs');

export class K8sKubectlUtil {
    /**
     * @return {ChildProcessUtil}
     */
    private get childProcessUtil(): ChildProcessUtil {
        return IOC.get(ChildProcessUtil);
    }

    private get a6sRailwayUtil(): A6sRailwayUtil {
        return IOC.get(A6sRailwayUtil);
    }

    /**
     * Delete K8s Object
     * @param {IK8sObject} k8sObject
     * @returns {Promise<void>}
     */
    async deleteObject(k8sObject: IK8sObject): Promise<any> {
        const result = await this.childProcessUtil.exec(`kubectl delete ${k8sObject.kind} ${k8sObject.metadata.name}`);

        if (result.code !== 0) {
            throw new Error('Unexpected error occurred ' + JSON.stringify(result));
        }

        if (result.stderr.trim().indexOf('Error from server (NotFound)') === 0) {
            return null;
        }

        return result.stdout;
    }

    /**
     * Create new K8s Object
     * @param {IK8sObject} k8sObject
     * @returns {Promise<void>}
     */
    async createObject(k8sObject: IK8sObject): Promise<IProcessResult> {
        const tmpFile = await tmp.file();
        fs.writeFileSync(tmpFile.path, jsyaml.dump(k8sObject), 'utf8');

        const cmd = 'kubectl create -f ' + tmpFile.path;

        const result = await this.childProcessUtil.exec(cmd);

        if (result.code !== 0) {
            throw new StationException(
                `Unable to create K8s object with name: ${k8sObject.metadata.name} and kind: ${k8sObject.kind} Error: ${result.stderr}`,
                ProcessExceptionType.CMD,
                {cmd, ... <IProcessResult>result}
            );
        }

        this.registerHash(k8sObject);

        return {
            code: result.code,
            stdout: result.stdout,
            stderr: result.stderr,
            cmd,
        };
    }

    /**
     * Apply object
     * @param {IK8sObject} k8sObject
     * @return {Promise<void>}
     */
    async applyObject(k8sObject: IK8sObject): Promise<IProcessResult> {
        const tmpFile = await tmp.file();
        fs.writeFileSync(tmpFile.path, jsyaml.dump(k8sObject), 'utf8');

        const cmd = 'kubectl apply -f ' + tmpFile.path;
        const result = await this.childProcessUtil.exec(cmd);

        if (result.code !== 0) {
            throw new StationException(
                `Unable to apply K8s object with name: ${k8sObject.metadata.name} and kind: ${k8sObject.kind} Error: ${result.stderr}`,
                ProcessExceptionType.CMD,
                {cmd, ... <IProcessResult>result}
            );
        }

        this.registerHash(k8sObject);

        return {
            code: result.code,
            stdout: result.stdout,
            stderr: result.stderr,
            cmd,
        };
    }

    /**
     * For every created or update K8s object we need to register its hashed value in a shared context
     * Path: context.k8s.hash.<kind>.<name>
     * @param {IK8sObject} k8sObject
     */
    private registerHash(k8sObject: IK8sObject): void {
        const sharedContext = this.a6sRailwayUtil.getSharedContext();

        if (!sharedContext.k8s) {
            sharedContext.k8s = {};
        }

        if (!sharedContext.k8s.hash) {
            sharedContext.k8s.hash = {};
        }

        if (!sharedContext.k8s.hash[k8sObject.kind]) {
            sharedContext.k8s.hash[k8sObject.kind] = {};
        }

        const content = jsyaml.dump(k8sObject);

        // populate hash
        sharedContext.k8s.hash[k8sObject.kind][k8sObject.metadata.name] = createHash('sha256').update(content).digest('base64');

    }

    /**
     * Get existing K8s Object
     * @param {IK8sObject} k8sObject
     * @returns {Promise<any>}
     */
    async getObject(k8sObject: IK8sObject): Promise<any> {
        const result = await this.childProcessUtil.exec(`kubectl get ${k8sObject.kind} ${k8sObject.metadata.name} -o json`);

        if (result.stderr.trim().indexOf('Error from server (NotFound)') === 0) {
            return null;
        }

        if (result.stdout) {
            return JSON.parse(result.stdout);
        }

        throw new Error('Unexpected error occurred ' + JSON.stringify(result));
    }

    /**
     * Get k8s objects
     *
     * @param {string} kind
     * @param {string} namespace
     * @return {Promise<string[]>}
     */
    async listObjects(kind: string, namespace = ''): Promise<string[]> {
        const cmd = [`kubectl get ${kind}`];

        if (namespace !== '') {
            cmd.push('--namespace ' + namespace);
        }

        cmd.push('-o name');

        const result = await this.childProcessUtil.exec(cmd.join(' '));

        return result.stdout
            .split('\n')
            .map(l => l.trim().split('/').pop())
            .filter(l => l)
        ;
    }
}
