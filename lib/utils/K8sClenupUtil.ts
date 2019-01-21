import {get, flattenDeep, difference} from 'lodash';
import chalk from 'chalk';
import * as minimatch from 'minimatch';
import {IOC} from '../services/IOC';
import {K8sHelmUtil} from './K8sHelmUtil';
import {K8sKubectlUtil} from './K8sKubectlUtil';
import {ProcessReporter} from './ProcessReporter';
import {IK8sCleanupOptions, IK8sObject, IReportRecord} from '../interfaces/index';

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
    public async cleanup(options: IK8sCleanupOptions) {
        const deployedHelms = await this.getDeployedHelms();
        const allHelmObjects: IK8sObject[] = <IK8sObject[]>flattenDeep(
            await Promise.all(
                deployedHelms.map(async (name) => await this.getHelmObjects(name))
            )
        );

        await this.cleanupHelmReleases(options, deployedHelms);

        await this.cleanupK8sObjects(
            'ConfigMap',
            allHelmObjects,
            await this.getDeployedConfigMaps(),
            await this.getClusterConfigMaps(options.namespace),
            get(options, 'allowed.configMaps', []),
            options.dryRun
        );

        await this.cleanupK8sObjects(
            'Secret',
            allHelmObjects,
            await this.getDeployedSecrets(),
            await this.getClusterSecrets(options.namespace),
            get(options, 'allowed.secrets', []),
            options.dryRun
        );

        await this.cleanupK8sObjects(
            'PersistentVolumeClaim',
            allHelmObjects,
            await this.getDeployedPersistentVolumeClaims(),
            await this.getClusterPersistentVolumeClaims(options.namespace),
            get(options, 'allowed.persistentVolumeClaims', []),
            options.dryRun
        );

        await this.cleanupK8sObjects(
            'StorageClass',
            allHelmObjects,
            await this.getDeployedStorageClasses(),
            await this.getClusterStorageClasses(options.namespace),
            get(options, 'allowed.storageClass', []),
            options.dryRun
        );
    }

    /**
     * @param {IK8sCleanupOptions} options
     * @param {string[]} deployedHelms
     * @return {Promise<void>}
     */
    private async cleanupHelmReleases(options: IK8sCleanupOptions, deployedHelms: string[]) {
        const allowedHelms = deployedHelms;
        const allowedPatterns = get(options, 'allowed.helms', []);
        const diff = this.getDifferenceInstalled(await this.getClusterHelms(), allowedHelms)
            .filter((d) => {
                for (const pattern of allowedPatterns) {
                    if (minimatch(d, pattern)) {
                        return false;
                    }
                }

                return true;
            })
        ;

        if (!options.dryRun) {
            await Promise.all(diff.map(async (name) => {
                try {
                    await this.k8sHelmUtil.remove(name);
                    console.log(chalk.green(`Helm "${name}" deleted`));
                } catch (e) {
                    console.log(chalk.red(`Helm "${name}" not deleted: ${e.message}`));
                }
            }));
        } else if (diff.length) {
            console.log(
                chalk.green('Helm releases to be removed: '),
                chalk.yellow(diff.join(', '))
            );
        }
    }

    /**
     * @param {string} kind
     * @param {IK8sObject[]} allHelmObjects
     * @param {string[]} deployed
     * @param {string[]} cluster
     * @param {string[]} allowedPatterns
     * @param {boolean} dryRun
     * @return {Promise<void>}
     */
    private async cleanupK8sObjects(
        kind: string,
        allHelmObjects: IK8sObject[],
        deployed: string[],
        cluster: string[],
        allowedPatterns: string[],
        dryRun: boolean
    ) {
        const allowedSecrets = [
            ...deployed,
            ...allHelmObjects
                .filter((object: IK8sObject) => object.kind === kind)
                .map((object: IK8sObject) => object.metadata.name),
        ];

        const diff = this.getDifferenceInstalled(cluster, allowedSecrets)
            .filter((d) => {
                for (const pattern of allowedPatterns) {
                    if (minimatch(d, pattern)) {
                        return false;
                    }
                }

                return true;
            })
        ;

        if (!dryRun) {
            await Promise.all(diff.map(async (name) => {
                try {
                    await this.k8sKubectlUtil
                        .deleteObject({
                            apiVersion: 'v1',
                            kind: kind,
                            metadata: {
                                name,
                            }
                        })
                    ;
                    console.log(chalk.green(`${kind} "${name}" deleted`));
                } catch (e) {
                    console.log(chalk.red(`${kind} "${name}" not deleted: ${e.message}`));
                }
            }));
        } else if (diff.length) {
            console.log(
                chalk.green(`${kind} to be removed: `),
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
    private async getDeployedStorageClasses() {
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
    private async getDeployedPersistentVolumeClaims() {
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
     * Get installed storage classes in the cluster
     *
     * @param {string} namespace
     * @return {Promise<string[]>}
     */
    private async getClusterStorageClasses(namespace = '') {
        return await this.k8sKubectlUtil.listObjects('StorageClass', namespace);
    }

    /**
     * Get installed persistent volume claim in the cluster
     *
     * @param {string} namespace
     * @return {Promise<string[]>}
     */
    private async getClusterPersistentVolumeClaims(namespace = '') {
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
