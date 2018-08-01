import {get, flattenDeep, difference} from 'lodash';
import chalk from 'chalk';
import {IOC} from '../IOC';
import {K8sHelmUtil} from './K8sHelmUtil';
import {K8sKubectlUtil} from './K8sKubectlUtil';
import {ProcessReporter} from './ProcessReporter';
import {IK8sCleanupOptions, IK8sObject, IReportRecord} from '../../interfaces';

export class K8sClenupUtil {
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
     * @param {IK8sCleanupOptions} options
     * @return {Promise<void>}
     */
    public async clean(options: IK8sCleanupOptions) {
        const deployedHelms = await this.getDeployedHelms();
        const allHelmObjects: IK8sObject[] = <IK8sObject[]>flattenDeep(
            await Promise.all(
                deployedHelms.map(async (name) => await this.getHelmObjects(name))
            )
        );

        await this.cleanHelm(options, deployedHelms);
        await this.cleanConfigMap(options, allHelmObjects);
        await this.cleanSecret(options, allHelmObjects);
        await this.cleanStorageClass(options, allHelmObjects);
        await this.cleanPersistentVolumeClaim(options, allHelmObjects);
    }

    /**
     * @param {IK8sCleanupOptions} options
     * @param {string[]} deployedHelms
     * @return {Promise<void>}
     */
    private async cleanHelm(options: IK8sCleanupOptions, deployedHelms: string[]) {
        const allowedHelms = [
            ...get(options, 'allowed.helms', []),
            ...deployedHelms
        ];

        const diff = this.getDifferenceInstalled(await this.getClusterHelms(), allowedHelms);

        if (options.cleanup) {
            for (const name of diff) {
                try {
                    this.k8sHelmUtil.remove(name, options.namespace)
                        .then(() => {
                            console.log(chalk.green(`Helm "${name}" deleted`));
                        })
                    ;
                } catch (e) {
                    console.log(chalk.red(`Helm "${name}" not deleted: ${e.message}`));
                }
            }
        } else {
            console.log(
                chalk.green('Remove helms: '),
                chalk.yellow(diff.join(', '))
            );
        }
    }

    /**
     * @param {IK8sCleanupOptions} options
     * @param {IK8sObject[]} allHelmObjects
     * @return {Promise<void>}
     */
    private async cleanConfigMap(options: IK8sCleanupOptions, allHelmObjects: IK8sObject[]) {
        const allowedConfigMaps = [
            ...await this.getDeployedConfigMaps(),
            ...get(options, 'allowed.configMaps', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'ConfigMap')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const diff = this.getDifferenceInstalled(await this.getClusterConfigMaps(), allowedConfigMaps);

        if (options.cleanup) {
            for (const name of diff) {
                try {
                    this.k8sKubectlUtil.deleteObject({
                            apiVersion: 'v1',
                            kind: 'ConfigMap',
                            metadata: {
                                name,
                            }
                        })
                        .then(() => {
                            console.log(chalk.green(`ConfigMap "${name}" deleted`));
                        })
                    ;
                } catch (e) {
                    console.log(chalk.red(`ConfigMap "${name}" not deleted: ${e.message}`));
                }
            }
        } else {
            console.log(
                chalk.green('Remove Config Maps: '),
                chalk.yellow(diff.join(', '))
            );
        }
    }

    /**
     * @param {IK8sCleanupOptions} options
     * @param {IK8sObject[]} allHelmObjects
     * @return {Promise<void>}
     */
    private async cleanSecret(options: IK8sCleanupOptions, allHelmObjects: IK8sObject[]) {
        const allowedSecrets = [
            ...await this.getDeployedSecrets(),
            ...get(options, 'allowed.secrets', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'Secret')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const diff = this.getDifferenceInstalled(await this.getClusterSecrets(), allowedSecrets);

        if (options.cleanup) {
            for (const name of diff) {
                try {
                    this.k8sKubectlUtil
                        .deleteObject({
                            apiVersion: 'v1',
                            kind: 'Secret',
                            metadata: {
                                name,
                            }
                        })
                        .then(() => {
                            console.log(chalk.green(`Secret "${name}" deleted`));
                        })
                    ;
                } catch (e) {
                    console.log(chalk.red(`Secret "${name}" not deleted: ${e.message}`));
                }
            }
        } else {
            console.log(
                chalk.green('Remove Secrets: '),
                chalk.yellow(diff.join(', '))
            );
        }
    }

    /**
     * @param {IK8sCleanupOptions} options
     * @param {IK8sObject[]} allHelmObjects
     * @return {Promise<void>}
     */
    private async cleanStorageClass(options: IK8sCleanupOptions, allHelmObjects: IK8sObject[]) {
        const allowedStorageClasses = [
            ...await this.getDeployedStorageClass(),
            ...get(options, 'allowed.storageClass', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'StorageClass')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const diff = this.getDifferenceInstalled(await this.getClusterStorageClass(), allowedStorageClasses);

        if (options.cleanup) {
            for (const name of diff) {
                try {
                    this.k8sKubectlUtil
                        .deleteObject({
                            apiVersion: 'v1',
                            kind: 'StorageClass',
                            metadata: {
                                name,
                            }
                        })
                        .then(() => {
                            console.log(chalk.green(`StorageClass "${name}" deleted`));
                        })
                    ;
                } catch (e) {
                    console.log(chalk.red(`StorageClass "${name}" not deleted: ${e.message}`));
                }
            }
        } else {
            console.log(
                chalk.green('Remove Storage Classes: '),
                chalk.yellow(diff.join(', '))
            );
        }
    }

    /**
     * @param {IK8sCleanupOptions} options
     * @param {IK8sObject[]} allHelmObjects
     * @return {Promise<void>}
     */
    private async cleanPersistentVolumeClaim(options: IK8sCleanupOptions, allHelmObjects: IK8sObject[]) {
        const allowedPersistentVolumeClaims = [
            ...await this.getDeployedPersistentVolumeClaim(),
            ...get(options, 'allowed.persistentVolumeClaims', []),
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === 'PersistentVolumeClaim')
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const diff = this.getDifferenceInstalled(await this.getClusterPersistentVolumeClaim(), allowedPersistentVolumeClaims);

        if (options.cleanup) {
            for (const name of diff) {
                try {
                    this.k8sKubectlUtil
                        .deleteObject({
                            apiVersion: 'v1',
                            kind: 'PersistentVolumeClaim',
                            metadata: {
                                name,
                            }
                        })
                        .then(() => {
                            console.log(chalk.green(`PersistentVolumeClaim "${name}" deleted`));
                        })
                    ;
                } catch (e) {
                    console.log(chalk.red(`PersistentVolumeClaim "${name}" not deleted: ${e.message}`));
                }
            }
        } else {
            console.log(
                chalk.green('Remove Persistent Volume Claims: '),
                chalk.yellow(diff.join(', '))
            );
        }
    }

    /**
     * Get k8s objects in helm
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
     * Get deployed secrets
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
     * Get deployed config maps
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
     * Get deployed storage classes
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
     * Get deployed persistent volume claims
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
