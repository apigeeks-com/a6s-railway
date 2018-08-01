import {get, flattenDeep, difference} from 'lodash';
import {IOC} from '../IOC';
import {K8sHelmUtil} from './K8sHelmUtil';
import {K8sKubectlUtil} from './K8sKubectlUtil';
import {ProcessReporter} from './ProcessReporter';
import {ICleanupOptions, IK8sObject, IReportRecord} from '../../interfaces';

export class CleanupUtil {
    private k8sHelmUtil: K8sHelmUtil;
    private k8sKubectlUtil: K8sKubectlUtil;
    private processReporter: ProcessReporter;

    constructor() {
        this.k8sHelmUtil = IOC.get(K8sHelmUtil);
        this.k8sKubectlUtil = IOC.get(K8sKubectlUtil);
        this.processReporter = IOC.get(ProcessReporter);
    }

    /**
     * Clean cluster
     *
     * @param {ICleanupOptions} options
     * @return {Promise<void>}
     */
    public async clean(options: ICleanupOptions) {
        const deployedHelms = await this.getDeployedHelms();
        const allHelmObjects = flattenDeep(
            await Promise.all(
                deployedHelms.map(async (name) => await this.getHelmObjects(name))
            )
        );

        const allowedConfigMaps = [
            ...await this.getDeployedConfigMaps(),
            ...get(options, 'allowed.configMaps', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'ConfigMap')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const allowedSecrets = [
            ...await this.getDeployedSecrets(),
            ...get(options, 'allowed.secrets', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'Secret')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const allowedStorageClasses = [
            ...await this.getDeployedStorageClass(),
            ...get(options, 'allowed.storageClass', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'StorageClass')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const allowedPersistentVolumeClaims = [
            ...await this.getDeployedPersistentVolumeClaim(),
            ...get(options, 'allowed.pvc', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'PersistentVolumeClaim')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const allowedHelms = [
            ...get(options, 'allowed.helms', []),
            ...deployedHelms
        ];

        console.log(
            '-----Remove helms ----->',
            this.getDifferenceInstalled(await this.getClusterHelms(), allowedHelms)
        );

        console.log(
            '-----Remove Config Maps ----->',
            this.getDifferenceInstalled(await this.getClusterConfigMaps(), allowedConfigMaps)
        );

        console.log(
            '-----Remove Secrets ----->',
            this.getDifferenceInstalled(await this.getClusterSecrets(), allowedSecrets)
        );

        console.log(
            '-----Remove Persistent Volume Claims ----->',
            this.getDifferenceInstalled(await this.getClusterPersistentVolumeClaim(), allowedPersistentVolumeClaims)
        );

        console.log(
            '-----Remove Storage Classes ----->',
            this.getDifferenceInstalled(await this.getClusterStorageClass(), allowedStorageClasses)
        );
    }

    /**
     *
     * @param {string} name
     * @return {Promise<IK8sObject[]>}
     */
    private async getHelmObjects(name: string) {
        return await this.k8sHelmUtil.getHelmObjects(name);
    }

    /**
     * Get deployed helms
     *
     * @return {Promise<string[]>}
     */
    private async getDeployedHelms() {
        return this.processReporter.getProcessLog()
            .filter(([, log]) => log.station.name === 'k8s.helm.install')
            .map(([, log]) => log.options.name)
        ;
    }

    /**
     * Get deployed secret
     *
     * @return {Promise<string[]>}
     */
    private async getDeployedSecrets() {
        return this.getK8sObjects()
            .filter(o => o.kind === 'Secret')
            .map(o => o.metadata.name)
        ;
    }

    /**
     * Get deployed config map
     *
     * @return {Promise<string[]>}
     */
    private async getDeployedConfigMaps() {
        return this.getK8sObjects()
            .filter(o => o.kind === 'ConfigMap')
            .map(o => o.metadata.name)
        ;
    }

    /**
     * Get deployed storage class
     *
     * @return {Promise<string[]>}
     */
    private async getDeployedStorageClass() {
        return this.getK8sObjects()
            .filter(o => o.kind === 'StorageClass')
            .map(o => o.metadata.name)
        ;
    }

    /**
     * Get deployed persistent volume claim
     *
     * @return {Promise<string[]>}
     */
    private async getDeployedPersistentVolumeClaim() {
        return this.getK8sObjects()
            .filter(o => o.kind === 'PersistentVolumeClaim')
            .map(o => o.metadata.name)
        ;
    }

    /**
     * Get installed helms in the cluster
     *
     * @return {Promise<string[]>}
     */
    private async getClusterHelms() {
        return await this.k8sHelmUtil.listInstalledHelms();
    }

    /**
     * Get installed secrets in the cluster
     *
     * @param {string} namespace
     * @return {Promise<string[]>}
     */
    private async getClusterSecrets(namespace = '') {
        return await this.k8sKubectlUtil.listObjects('Secret', namespace);
    }

    /**
     * Get installed config maps in the cluster
     *
     * @param {string} namespace
     * @return {Promise<string[]>}
     */
    private async getClusterConfigMaps(namespace = '') {
        return await this.k8sKubectlUtil.listObjects('ConfigMap', namespace);
    }


    /**
     * Get installed storage class in the cluster
     *
     * @param {string} namespace
     * @return {Promise<string[]>}
     */
    private async getClusterStorageClass(namespace = '') {
        return await this.k8sKubectlUtil.listObjects('StorageClass', namespace);
    }

    /**
     * Get installed persistent volume claim in the cluster
     *
     * @param {string} namespace
     * @return {Promise<string[]>}
     */
    private async getClusterPersistentVolumeClaim(namespace = '') {
        return await this.k8sKubectlUtil.listObjects('PersistentVolumeClaim', namespace);
    }

    /**
     * Return Difference
     *
     * @param {string[]} inCluster
     * @param {string[]} deployed
     * @return {string[]}
     */
    private getDifferenceInstalled(inCluster: string[], deployed: string[]) {
        return difference(inCluster, deployed);
    }

    /**
     * Get all deployed k8s objects
     *
     * @return {IK8sObject[]}
     */
    private getK8sObjects(): IK8sObject[] {
        return flattenDeep(
            this.processReporter.getProcessLog()
            .filter(([, log]) => get(log, 'report.handler'))
            .map(([, log]) =>
                get(log, 'report.handler')
                    .map((reportRecord: IReportRecord) => get(reportRecord, 'payload.k8sObject'))
                    .filter((reportRecord: IReportRecord) => reportRecord)
            )
        );
    }
}
