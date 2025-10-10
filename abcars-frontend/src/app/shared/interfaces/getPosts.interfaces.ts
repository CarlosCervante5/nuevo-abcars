export interface GetPosts {
    status:  number;
    message: string;
    data:    Data;
}

export interface GetRandomPosts {
    data:    Post[];
}

export interface GetPost {
    status:  number;
    message: string;
    data:    Post;
}

export interface Data {
    current_page:   number;
    data:           Post[];
    first_page_url: string;
    from:           number;
    last_page:      number;
    last_page_url:  string;
    links:          Link[];
    next_page_url:  null;
    path:           string;
    per_page:       number;
    prev_page_url:  null;
    to:             number;
    total:          number;
}

export interface Post {
    uuid:       string;
    status:     string;
    title:      string;
    image_path: string;
    url_name:   string;
    contents:   Content[];
    created_at: Date;
}

export interface Content{
    uuid:         string;
    sort_id:      number;
    content_text: string;
    content_type: string;
    content_multimedia_1: string;
    content_multimedia_2: string;
    multimedia_name_1: string;

    created_at: Date;
}

export interface PostOrder {
    id:          string;
    sort_id:     number;
    content_text: string;
    content_type: string;
    content_multimedia_1: string;
    content_multimedia_2: string;
    selected: boolean;
 }

export interface Link {
    url:    null | string;
    label:  string;
    active: boolean;
}
