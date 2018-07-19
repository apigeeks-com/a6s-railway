#!/usr/bin/env node

import * as commander from 'commander';
import * as plugins from './lib/stations';
import {A6sRailway} from './lib/A6sRailway';

// prepare commander
commander
    .version(require('../package.json').version, '-v, --version')
    .usage('[options] <file> Deployment descriptor file path')
    .arguments('<path>')
    .action((path, options) => {
        options.map = path;
    });
// parse environment variables
commander.parse(process.argv);

if (!commander.map) {
    console.error('Deployment descriptor file path is not provided.\n');
    commander.outputHelp();
    process.exit(1);
}

new A6sRailway(commander.map)
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

    ])
    .execute()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
