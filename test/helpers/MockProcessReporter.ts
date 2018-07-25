import {ProcessReporter} from '../../lib/services/utils';
import {IHandlerReportRecord} from '../../lib/interfaces';
import {IRailWayStation} from '../../lib/interfaces/core';

export class MockProcessReporter extends ProcessReporter {
    public setReport(
        station: IRailWayStation,
        report: IHandlerReportRecord,
        options: any,
    ) {
        const handler = this.handlers.get(this.generateProcessId(station));

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

        if (handler) {
            handler.report = report;
            handler.options = options;
        }
    }
}
