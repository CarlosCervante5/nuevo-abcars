export interface GetStatisticalAccount {
    status:  number;
    message: string;
    data:    Data;
}

export interface Data {
    to_appraise:     number;
    checklist_ready: number;
    valuated:        number;
}
