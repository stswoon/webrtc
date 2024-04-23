export interface Room {
    users: User[],
}

export interface User {
    id: string;
    active: boolean;
    candidate?: string
}
