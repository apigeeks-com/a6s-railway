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
            handler.report = report;
            handler.options = options;
        }
    }

    static buildTreeReport(parent: string[], handlers: any[]): any[] {
        return handlers
            .filter(([, h]) => {
                const processPath = h.path.substr(2) || h.station.name;

                return processPath.split('->').length - 1 === parent.length &&
                    processPath.substr(0, parent.join('->').length)
                ;

            })
            .map(([, h]) => {
                const processPath = h.path.substr(2) || h.station.name;

                return {
                    name: h.station.name,
                    options: h.options,
                    report: h.report,
                    children: ProcessReporter.buildTreeReport(processPath.split('->'), handlers)
                };
            })
        ;
    }

    static getReport() {
        const handlers: any[] = [...ProcessReporter.handlers].sort(([, a]: any, [, b]: any) => {
            return a.path.substr(2).split('->').length - b.path.substr(2).split('->').length;
        });


        if (!handlers || !handlers.length) {
            return {};
        }

        const [, firstHandler] = handlers[0];
        const processPath = firstHandler.path.substr(2) || firstHandler.station.name;
        const pathList = processPath.split('->');

        return {
            name: firstHandler.station.name,
            options: firstHandler.options,
            report: firstHandler.report,
            children: ProcessReporter.buildTreeReport(pathList, handlers)
        };
    }

    static generateProcessId(station: IRailWayStation) {
        return Buffer.from(JSON.stringify(station)).toString('base64');
    }
}
