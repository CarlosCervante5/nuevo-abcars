export interface GetPostDetail {
    status:  number;
    message: string;
    data:    Data;
}

export interface Data {
    uuid:         string;
    status:       string;
    category:     null;
    sub_category: null;
    key_words:    null;
    title:        string;
    image_path:   string;
    url_name:     string;
    created_at:   Date;
    contents:     any[];
}
