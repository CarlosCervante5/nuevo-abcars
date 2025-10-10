export interface ResetPassword {
    status:  string;
    code:    string;
    message: string;
    user:    User;
}

export interface User {
    id:         number;
    name:       string;
    surname:    string;
    email:      string;
    picture:    null;
    gender:     string;
    created_at: Date;
    updated_at: Date;
}
