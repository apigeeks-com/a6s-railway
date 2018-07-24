#!/usr/bin/env node

import * as commander from 'commander';
import * as plugins from './lib/stations';
import {A6sRailway} from './lib/A6sRailway';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import {A6sRailwayUtil, K8sHelmUtil, ProcessReporter} from './lib/services/utils';
import {IOC} from './lib/services';
import {ShellCmdStdOutResolver, ContextResolver} from './lib/resolvers';

// prepare commander
commander
    .version(require('../package.json').version, '-v, --version')
    .usage('[options] <file> Deployment descriptor file path')
    .arguments('<path>')
    .action((configPath: string, options) => {
        options.map = configPath;
    })
    .option('-o, --output <path>', 'Store execution report in given location')
;
// parse environment variables
commander.parse(process.argv);

if (!commander.map) {
    console.error('Deployment descriptor file path is not provided.\n');
    commander.outputHelp();
    process.exit(1);
}


const processReporter = IOC.get(ProcessReporter);
const a6sRailwayUtil = IOC.get(A6sRailwayUtil);

const init = async () => {
    const map = await a6sRailwayUtil.readYamlFile(commander.map);
    const pwd = path.resolve(path.dirname(commander.map));
    map.station = await a6sRailwayUtil.resolveTree(map.station, pwd);

    return map;
};

const saveReport = (reportPath: string) => {
    if (reportPath) {
        const baseDir = path.dirname(reportPath);

        if (!fs.existsSync(baseDir)) {
            mkdirp.sync(baseDir);
        }

        fs.writeFileSync(reportPath, JSON.stringify(processReporter.getReport(), null, '   '));
    }
};

init().then((configMap) => {
    const a6sRailway = new A6sRailway(configMap);

    a6sRailway
        .register([
            // load flow control stations
            new plugins.A6s_Railway_If_StationHandler(),
            new plugins.A6s_Railway_Switch_StationHandler(),
            new plugins.A6s_Railway_ExternalFile_StationHandler(),
            new plugins.A6s_Railway_ParallelExecution_StationHandler(),
            new plugins.A6s_Railway_SequenceExecution_StationHandler(),

            // load application specific stations
            new plugins.K8s_Helm_Deployment_StationHandler(),
            new plugins.K8s_Kubectl_ApplyObject_StationHandler(),

            new plugins.K8s_ConfigMap_StationHandler(),
            new plugins.K8s_Secret_Docker_Registry_StationHandler(),
            new plugins.K8s_Secret_Generic_StationHandler(),
            new plugins.K8s_Secret_TLS_StationHandler(),

            new plugins.Write_File_StationHandler(),

            // resolvers
            new ContextResolver(),
            new ShellCmdStdOutResolver(),

        ])
        .execute()
        .then(() => {
            saveReport(commander.output);
        })
        .catch(e => {
            saveReport(commander.output);
            console.error(e);
            process.exit(1);
        })
    ;
});
