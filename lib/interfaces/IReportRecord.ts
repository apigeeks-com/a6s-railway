export enum IReportRecordType {
    CMD = 'cmd',
    RESOLVER = 'resolver',
}

export interface IReportRecord {
    type: IReportRecordType | string;
    payload?: any;
}
