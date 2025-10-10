export interface Login {
    code:   number;
    status: string;
    message: string;
    token:  string;
    user: User
}

export interface User {
    id:          number;
    name:        string;
    surname:     string;
    email:       string;
    picture:     null;
    gender:      string;
    created_at:  Date;
    updated_at:  Date;
    roles:       Role[];
    permissions: any[];
}

export interface Role {
    id:         number;
    name:       string;
    guard_name: string;
    created_at: Date;
    updated_at: Date;
    pivot:      Pivot;
}

export interface Pivot {
    model_id:   number;
    role_id:    number;
    model_type: string;
}
