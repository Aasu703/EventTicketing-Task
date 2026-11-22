export type Role = 'ADMIN' | 'ORGANIZER' | 'CUSTOMER';

export interface User {
    id: number;
    username: string;
    email: string;
    phoneNumber: string;
    role: Role[];
}