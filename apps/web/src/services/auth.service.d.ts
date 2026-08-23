export declare function getMe(): Promise<{
    id: string;
    name: string;
    username: string;
    email: string;
    roles: string[];
    groups: string[];
}>;
