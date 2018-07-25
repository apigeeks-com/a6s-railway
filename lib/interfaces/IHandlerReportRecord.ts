import {IReportRecord} from './IReportRecord';

export interface IHandlerReportRecord {
    resolvers: Array<IReportRecord[]>;
    handler: IReportRecord[];
}