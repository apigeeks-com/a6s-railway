import {IReportRecord} from './IReportRecord';

export interface IReport {
    name: string;
    description?: string;
    options?: any;
    report?: IReportRecord;
    children?: IReport[];
}
