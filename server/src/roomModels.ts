export interface Room {
    users: User[],
}

export interface User {
    id: string;
    active: boolean;
    offer?: any;
    candidate?: any
    answer?: any
}
