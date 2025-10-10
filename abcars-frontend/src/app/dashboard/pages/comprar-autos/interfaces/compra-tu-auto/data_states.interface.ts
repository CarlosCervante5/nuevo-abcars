export interface DataStates {
    code:   number;
    status: string;
    states: State[];
    total:  number;
}

export interface State {
    id:          number;
    iso:         string;
    name:        string;
    description: string;
    created_at:  Date;
    updated_at:  Date;
}
