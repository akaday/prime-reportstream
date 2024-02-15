import axios, { AxiosError } from "axios";
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
} from "react";

import { AxiosOptionsWithSegments, RSEndpoint } from "../../config/endpoints";
import { RSNetworkError } from "../../utils/RSNetworkError";
import { useAppInsightsContext } from "../AppInsights";
import { useSessionContext } from "../Session";

export type AuthorizedFetcher<T = any> = (
    EndpointConfig: RSEndpoint,
    options?: Partial<AxiosOptionsWithSegments>,
) => Promise<T>;

type IAuthorizedFetchContext<T = any> = AuthorizedFetcher<T>;

export const AuthorizedFetchContext = createContext<IAuthorizedFetchContext>(
    () => Promise.reject("fetcher uninitialized"),
);

const AuthorizedFetchProvider = ({
    children,
}: PropsWithChildren<{ initializedOverride?: boolean }>) => {
    const { activeMembership, authState = {} } = useSessionContext();
    const { fetchHeaders } = useAppInsightsContext();
    const authorizedFetch = useCallback(
        async function <TData>(
            EndpointConfig: RSEndpoint,
            options: Partial<AxiosOptionsWithSegments> = {},
        ): Promise<TData> {
            const headerOverrides = options?.headers ?? {};

            const authHeaders = {
                ...fetchHeaders(),
                "authentication-type": "okta",
                authorization: `Bearer ${
                    authState?.accessToken?.accessToken ?? ""
                }`,
                organization: `${activeMembership?.parsedName ?? ""}`,
            };
            const headers = { ...authHeaders, ...headerOverrides };

            const axiosConfig = EndpointConfig.toAxiosConfig({
                ...options,
                headers,
            });

            try {
                const res = await axios<TData>(axiosConfig);
                return res.data;
            } catch (e: any) {
                if (e instanceof AxiosError) {
                    throw new RSNetworkError(e);
                }
                throw e;
            }
        },
        [
            activeMembership?.parsedName,
            authState?.accessToken?.accessToken,
            fetchHeaders,
        ],
    );

    return (
        <AuthorizedFetchContext.Provider value={authorizedFetch}>
            {children}
        </AuthorizedFetchContext.Provider>
    );
};

// an extra level of indirection here to allow for generic typing of the returned fetch function
export function useAuthorizedFetch<
    TQueryFnData = unknown,
>(): IAuthorizedFetchContext<TQueryFnData> {
    return useContext<IAuthorizedFetchContext<TQueryFnData>>(
        AuthorizedFetchContext,
    );
}

export default AuthorizedFetchProvider;