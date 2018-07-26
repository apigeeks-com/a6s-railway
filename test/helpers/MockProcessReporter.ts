import {ProcessReporter} from '../../lib/services/utils';
import {IHandlerReportRecord} from '../../lib/interfaces';
import {IRailWayStation} from '../../lib/interfaces/core';

export class MockProcessReporter extends ProcessReporter {
    public registerHandler(
        path: string[],
        station: IRailWayStation,
        report: IHandlerReportRecord,
        options: any,
    ) {
        if (report.handler) {
            report.handler = report.handler.map(r => {
                if (r.payload.cmd) {
                    r.payload.cmd = '';
                }

                return r;
            });
        }

        if (report.resolvers) {
            report.resolvers = report.resolvers.map(hr => {
                return hr.map((r) => {
                    if (r.payload.cmd) {
                        r.payload.cmd = '';
                    }

                    return r;
                });
            });
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
}
