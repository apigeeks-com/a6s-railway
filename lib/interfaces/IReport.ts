import {IReportRecord} from './IReportRecord';

export interface IReport {
    name: string;
    options?: any;
    report?: IReportRecord;
    children?: IReport[];
}
