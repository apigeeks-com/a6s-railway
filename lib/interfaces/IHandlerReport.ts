import {IReportRecord} from './IReportRecord';

export interface IHandlerReport {
    error?: any;
    resolvers?: Array<IReportRecord[]>;
    handler?: IReportRecord[];
}
