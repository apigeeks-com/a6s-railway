import {IReportRecord} from './IReportRecord';

export interface IHandlerReportRecord {
    error?: any;
    resolvers?: Array<IReportRecord[]>;
    handler?: IReportRecord[];
}
