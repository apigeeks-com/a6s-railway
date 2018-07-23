import {IRailWayStation} from '../../interfaces/core';
import {IProcess} from '../../interfaces';

export class ProcessReporter {
    static handlers: Map<string, any> = new Map();

    static registerHandler(path: string, station: IRailWayStation) {
        ProcessReporter.handlers.set(
            ProcessReporter.generateProcessId(station),
            {
                path,
                station,
            }
        );
    }

    static setReport(
        station: IRailWayStation,
        report: IProcess | undefined,
        options: any,
    ) {
        const handler = ProcessReporter.handlers.get(ProcessReporter.generateProcessId(station));

        if (handler) {
            handler.report = {
                ...report,
                options
            };
        }
    }

    static getReport() {
        const report: any = {};

        for (const [, r] of [...ProcessReporter.handlers]) {
            const id = '_' + Math.random().toString(36).substr(2, 9);

            report[`${r.path}${id}`.substr(1)] = r.report;
        }

        return report;
    }

    static generateProcessId(station: IRailWayStation) {
        return Buffer.from(JSON.stringify(station)).toString('base64');
    }
}