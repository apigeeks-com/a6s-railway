export enum IReportRecordType {
    CMD = 'cmd',
}

export interface IReportRecord {
    type: IReportRecordType | string;
    payload?: any;
}
