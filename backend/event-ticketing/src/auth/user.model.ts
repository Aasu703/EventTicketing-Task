export type Role = 'Admin' | 'Organizer' | 'Customer';

export interface User {
    id: number;
    username: string;
    email: string;
    phoneNumber: number;
    roles: Role[];
}