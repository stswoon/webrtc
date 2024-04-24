export interface User {
    id: string;
    active: boolean;
    offer?: any;
    candidate?: any
    answer?: any
}

export interface AppState {
    users: User[]
}
