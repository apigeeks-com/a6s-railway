import {IHelmDeploymentInfo, IHelmChartInstall, IReportRecord} from '../../interfaces';
import * as yaml from 'js-yaml';
import {flatten} from 'flat';
import {ChildProcessUtil} from './ChildProcessUtil';
import {IOC} from '../IOC';
import {A6sRailwayUtil} from './A6sRailwayUtil';

export class K8sHelmUtil {
    /**
     * @return {ChildProcessUtil}
     */
    private get childProcessUtil(): ChildProcessUtil {
        return IOC.get(ChildProcessUtil);
    }

    /**
     * Remove helm chart
     * @param {string} name
     * @param {string} namespace
     * @return {Promise<void>}
     */
    async remove(name: string, namespace: string): Promise<IReportRecord> {
        const cmd = `helm del --namespace ${namespace} --purge ${name}`;
        const result = await this.childProcessUtil.exec(cmd);

        if (result.code !== 0) {
            throw new Error(result.stderr);
        }

        return {
            stdout: result.stdout,
            stderr: result.stderr,
            cmd,
        };
    }

    /**
     * Update or install helm chart
     * @param {IHelmChartInstall} config
     * @return {Promise<void>}
     */
    async updateOrInstall(config: IHelmChartInstall): Promise<IReportRecord> {
        const a6sRailwayUtil = IOC.get(A6sRailwayUtil);

        const cmd = [
            'helm upgrade --install'
        ];

        if (config.hasOwnProperty('namespace')) {
            cmd.push('--namespace ' + config.namespace);
        }

        if (config.hasOwnProperty('timeout')) {
            cmd.push('--timeout ' + config.timeout);
        }

        if (config.hasOwnProperty('wait')) {
            cmd.push('--wait');
        }

        // tslint:disable-next-line
        config.variable_files && config.variable_files.forEach(f => {
            cmd.push('-f ' + a6sRailwayUtil.getAbsolutePath(f));
        });

        if (config.variables) {
            const flattened: any = flatten(config.variables);
            const keyValue = [];
            for (const key in flattened) {
                if (flattened.hasOwnProperty(key)) {
                    keyValue.push(key + '=' + flattened[key]);
                }
            }

            if (keyValue.length) {
                cmd.push('--set ' + keyValue.join(','));
            }
        }

        cmd.push(config.name);
        cmd.push(a6sRailwayUtil.getAbsolutePath(config.chart));

        const result = await this.childProcessUtil.exec(cmd.join(' '));

        if (result.code !== 0) {
            throw new Error(result.stderr);
        }

        return {
            stdout: result.stdout,
            stderr: result.stderr,
            cmd: cmd.join(' '),
        };
    }

    /**
     * List installed helms
     * @returns {Promise<string[]>}
     */
    async listInstalledHelms(): Promise<string[]> {
        const result = await this.childProcessUtil.exec('helm list -q');

        return result.stdout
            .split('\n')
            .map(l => l.trim())
            .filter(l => l)
        ;
    }

    /**
     * Check if deployment exists
     * @param {string} name
     * @returns {Promise<boolean>}
     */
    async isDeploymentExists(name: string): Promise<boolean> {
        const helmResult = await this.childProcessUtil.exec(`helm get ${name}`);

        return helmResult.stdout.trim() !== `Error: release: "${name}" not found`;
    }

    /**
     * Get information about helm deployment
     * @param {string} name
     * @returns {Promise<IHelmDeploymentInfo>}
     */
    async getHelmDeployment(name: string): Promise<IHelmDeploymentInfo> {
        const helmResult = await this.childProcessUtil.exec(`helm get ${name}`);

        if (helmResult.stdout.indexOf('Error') === 0) {
            throw new Error(helmResult.stdout);
        }

        helmResult.stdout
            .replace('COMPUTED VALUES', 'COMPUTE-VALUES')
            .replace('USER-SUPPLIED VALUES', 'USER-SUPPLIED-VALUES')
        ;

        const lines = helmResult.stdout.split('\n').map(l => l.trim());

        const revisionKey = 'REVISION: ';
        const releasedKey = 'RELEASED: ';
        const chartKey = 'CHART: ';
        const userSuppliedValuesKey = 'USER-SUPPLIED VALUES:';
        const computedValuesKey = 'COMPUTED VALUES:';

        const revisionLine = lines.find(l => l.indexOf(revisionKey) === 0);
        const releasedLine = lines.find(l => l.indexOf(releasedKey) === 0);
        const chartLine = lines.find(l => l.indexOf(chartKey) === 0);
        const userValuesLine = lines.find(l => l.indexOf(userSuppliedValuesKey) === 0);
        const computedValuesLine = lines.find(l => l.indexOf(computedValuesKey) === 0);

        let userSuppliedValues = {};
        let computedValues = {};

        if (userValuesLine) {
            let idx = lines.indexOf(userValuesLine);
            const values = [];

            while (lines[++idx]) {
                const line = lines[idx].trimRight();

                if (line.length) {
                    values.push(line);
                }
            }

            userSuppliedValues = yaml.safeLoad(values.join('\n')) || {};
        }

        if (computedValuesLine) {
            let idx = lines.indexOf(computedValuesLine);
            const values = [];

            while (lines[++idx]) {
                const line = lines[idx].trimRight();

                if (line.length) {
                    values.push(line);
                }
            }

            computedValues = yaml.safeLoad(values.join('\n')) || {};
        }

        return {
            revision: revisionLine && revisionLine.substring(revisionKey.length),
            released: releasedLine && new Date(releasedLine.substring(releasedKey.length)),
            chart: chartLine && chartLine.substring(chartKey.length),
            userSuppliedValues: userSuppliedValues,
            computedValues: computedValues
        };
    }
}

