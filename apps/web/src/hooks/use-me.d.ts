export declare function useMe(): {
    user: {
        id: string;
        name: string;
        username: string;
        email: string;
        roles: string[];
        groups: string[];
    } | undefined;
    isLoading: boolean;
    isError: any;
    mutate: import("swr").KeyedMutator<{
        id: string;
        name: string;
        username: string;
        email: string;
        roles: string[];
        groups: string[];
    }>;
};
