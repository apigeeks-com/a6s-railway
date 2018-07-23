import {IK8sObject, IProcess} from '../../interfaces';
import * as jsyaml from 'js-yaml';
import {ChildProcessUtil} from './ChildProcessUtil';
import {IOC} from '../IOC';

const tmp = require('tmp-promise');
const fs = require('fs');

export class K8sKubectlUtil {

    private get childProcessUtil(): ChildProcessUtil {
        return IOC.get(ChildProcessUtil);
    }

    /**
     * Delete K8s Object
     * @param {IK8sObject} k8sObject
     * @returns {Promise<void>}
     */
    async deleteObject(k8sObject: IK8sObject): Promise<any> {
        const result = await this.childProcessUtil.exec(`kubectl delete ${k8sObject.kind} ${k8sObject.metadata.name}`);

        if (result.stderr.trim().indexOf('Error from server (NotFound)') === 0) {
            return null;
        }

        if (result.stdout) {
            return result.stdout;
        }

        throw new Error('Unexpected error occurred ' + JSON.stringify(result));
    }

    /**
     * Create new K8s Object
     * @param {IK8sObject} k8sObject
     * @returns {Promise<void>}
     */
    async createObject(k8sObject: IK8sObject): Promise<IProcess> {
        const tmpFile = await tmp.file();
        fs.writeFileSync(tmpFile.path, jsyaml.dump(k8sObject), 'utf8');

        const cmd = 'kubectl create -f ' + tmpFile.path;

        const result = await this.childProcessUtil.exec(cmd);

        if (result.code !== 0) {
            throw new Error(`Unable to create K8s object with name: ${k8sObject.metadata.name} and kind: ${k8sObject.kind} Error: ${result.stderr}`);
        }

        return {
            stdout: result.stdout,
            cmd,
        };
    }

    /**
     * Apply object
     * @param {IK8sObject} k8sObject
     * @return {Promise<void>}
     */
    async applyObject(k8sObject: IK8sObject): Promise<IProcess> {
        const tmpFile = await tmp.file();
        fs.writeFileSync(tmpFile.path, jsyaml.dump(k8sObject), 'utf8');

        const cmd = 'kubectl apply -f ' + tmpFile.path;
        const result = await this.childProcessUtil.exec(cmd);

        if (result.code !== 0) {
            throw new Error(`Unable to apply K8s object with name: ${k8sObject.metadata.name} and kind: ${k8sObject.kind} Error: ${result.stderr}`);
        }

        return {
            stdout: result.stdout,
            cmd,
        };
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
}
