export interface GetClientPriceOffer {
    status:  number;
    message: string;
    data:    Data;
}

export interface Data {
    current_page:   number;
    data:           Datum[];
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

export interface Datum {
    uuid:            string;
    type:            string;
    category:        string;
    status:          string;
    description:     null;
    opportunity_id:  null;
    dealership_name: string;
    created_at:      Date;
    campaign:        Campaign;
    forms:           Form[];
    customer:        Customer;
}

export interface Campaign {
    uuid:        string;
    name:        string;
    source:      string;
    channel:     string;
    description: null;
    created_at:  Date;
}

export interface Customer {
    uuid:              string;
    honorific:         null;
    bp_id:             null;
    crm_id:            null;
    incadea_id:        null;
    rfc:               null;
    tax_regime:        null;
    name:              string;
    last_name:         string;
    age:               null;
    birthday:          null;
    gender:            null;
    phone_1:           string;
    phone_2:           null;
    phone_3:           null;
    cellphone:         null;
    email_1:           string;
    email_2:           null;
    contact_method:    null;
    zip_code:          null;
    address:           null;
    state:             null;
    city:              null;
    district:          null;
    neighborhood:      null;
    marital_status:    null;
    educational_level: null;
    origin_agency:     null;
    picture:           null;
    created_at:        Date;
}

export interface Form {
    uuid:           string;
    name:           string;
    selected_value: null | string;
}

export interface Link {
    url:    null | string;
    label:  string;
    active: boolean;
}
