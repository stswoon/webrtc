export interface User {
    id: string;
    active: boolean;
}

export interface AppState {
    users: User[]
}
