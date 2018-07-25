import {IRailWayStation} from '../../interfaces/core';
import {IReport, IHandlerReportRecord} from '../../interfaces';

export class ProcessReporter {
    protected handlers: Map<string, any> = new Map();

    /**
     * @param {string} path
     * @param {IRailWayStation} station
     */
    public registerHandler(path: string[], station: IRailWayStation) {
        const id = this.generateProcessId(station);

        if (this.handlers.get(id)) {
            return;
        }

        this.handlers.set(
            id,
            {
                path,
                station,
            }
        );
    }

    /**
     * @param {IRailWayStation} station
     * @param {IHandlerReportRecord} report
     * @param options
     */
    public setReport(
        station: IRailWayStation,
        report: IHandlerReportRecord,
        options: any,
    ) {
        const handler = this.handlers.get(this.generateProcessId(station));

        if (handler) {
            handler.report = report;
            handler.options = options;
        }
    }

    /**
     * Returned process report
     *
     * @return {IReport}
     */
    public getReport(): IReport {
        const handlers: any[] = [...this.handlers].sort(([, a]: any, [, b]: any) => {
            return a.path.length - b.path.length;
        });

        if (!handlers || !handlers.length) {
            return <IReport>{};
        }

        const [, firstHandler] = handlers[0];
        const processPath = firstHandler.path.length
            ? firstHandler.path
            : [firstHandler.station.name]
        ;

        return {
            name: firstHandler.station.name,
            options: firstHandler.options,
            report: firstHandler.report,
            children: this.buildTreeReport(processPath, handlers)
        };
    }

    /**
     * @param {IRailWayStation} station
     * @return {string}
     */
    protected generateProcessId(station: IRailWayStation) {
        return Buffer.from(JSON.stringify(station)).toString('base64');
    }

    /**
     * @param {string[]} parent
     * @param {any[]} handlers
     * @return {any[]}
     */
    protected buildTreeReport(parent: string[], handlers: any[]): any[] {
        return handlers
            .filter(([, h]) => {
                const processPath = h.path.length ? h.path : [h.station.name];

                // Checking the equivalence of arrays
                return processPath.length - 1 === parent.length &&
                    processPath.join().substr(0, parent.join().length) === parent.join()
                ;

            })
            .map(([, h]) => {
                const processPath = h.path.length ? h.path : [h.station.name];

                return {
                    name: h.station.name,
                    options: h.options,
                    report: h.report,
                    children: this.buildTreeReport(processPath, handlers)
                };
            })
        ;
    }
}
