import {IRailWayStation} from '../../interfaces/core';
import {IReport, IHandlerReport} from '../../interfaces';

export class ProcessReporter {
    protected handlers: Map<string[], any> = new Map();

    /**
     * @param {string} path
     * @param {IRailWayStation} station
     * @param report
     * @param options
     */
    public registerHandler(
        path: string[],
        station: IRailWayStation,
        report: IHandlerReport,
        options?: any,
    ) {
        const reportObject = this.handlers.get(path);

        if (reportObject && reportObject.options) {
            options = Object.assign(reportObject.options, options || {});
        }

        this.handlers.set(
            path,
            {
                station,
                report,
                options,
            }
        );
    }

    /**
     *  Returns deployed stations
     *
     * @return {Array<string[], number>}
     */
    public getProcessLog() {
        return [...this.handlers];
    }

    /**
     * Returns process report
     *
     * @return {IReport}
     */
    public getReport(): IReport {
        const handlers: any[] = [...this.handlers].sort(([a]: any, [b]: any) => {
            return a.length - b.length;
        });

        if (!handlers || !handlers.length) {
            return <IReport>{};
        }

        const [parentPath, firstHandler] = handlers[0];
        const processPath = parentPath.length
            ? parentPath
            : [firstHandler.station.name]
        ;

        return {
            name: firstHandler.station.name,
            description: firstHandler.station.description,
            options: firstHandler.options,
            report: firstHandler.report,
            children: this.buildTreeReport(processPath, handlers)
        };
    }

    /**
     * @param {string[]} parent
     * @param {any[]} handlers
     * @return {any[]}
     */
    protected buildTreeReport(parent: string[], handlers: any[]): any[] {
        return handlers
            .filter(([p, h]) => {
                const processPath = p.length ? p : [h.station.name];

                // Checking the equivalence of arrays
                return processPath.length - 1 === parent.length &&
                    processPath.join().substr(0, parent.join().length) === parent.join()
                ;

            })
            .map(([p, h]) => {
                const processPath = p.length ? p : [h.station.name];

                return {
                    name: h.station.name,
                    description: h.station.description,
                    options: h.options,
                    report: h.report,
                    children: this.buildTreeReport(processPath, handlers)
                };
            })
        ;
    }
}
