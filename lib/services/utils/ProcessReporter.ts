import {IRailWayStation} from '../../interfaces/core';
import {IReportRecord} from '../../interfaces';

export class ProcessReporter {
    private handlers: Map<string, any> = new Map();

    /**
     * @param {string} path
     * @param {IRailWayStation} station
     */
    public registerHandler(path: string, station: IRailWayStation) {
        this.handlers.set(
            this.generateProcessId(station),
            {
                path,
                station,
            }
        );
    }

    /**
     * @param {IRailWayStation} station
     * @param {IReportRecord | undefined} report
     * @param options
     */
    public setReport(
        station: IRailWayStation,
        report: IReportRecord | undefined,
        options: any,
    ) {
        const handler = this.handlers.get(this.generateProcessId(station));

        if (handler) {
            handler.report = report;
            handler.options = options;
        }
    }

    /**
     * @return {any}
     */
    public getReport() {
        const handlers: any[] = [...this.handlers].sort(([, a]: any, [, b]: any) => {
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
            children: this.buildTreeReport(pathList, handlers)
        };
    }

    /**
     * @param {IRailWayStation} station
     * @return {string}
     */
    private generateProcessId(station: IRailWayStation) {
        return Buffer.from(JSON.stringify(station)).toString('base64');
    }

    /**
     * @param {string[]} parent
     * @param {any[]} handlers
     * @return {any[]}
     */
    private buildTreeReport(parent: string[], handlers: any[]): any[] {
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
                    children: this.buildTreeReport(processPath.split('->'), handlers)
                };
            })
        ;
    }
}
