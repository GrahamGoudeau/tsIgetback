import { Maybe } from 'tsmonad';

export type AuthCallback = (state: Maybe<UserInfo>) => void;

export interface UserInfo {
    firstName: string;
    lastName: string;
    email: string;
}

export class AuthState {
    private signedIn: Maybe<boolean> = Maybe.nothing<boolean>();
    private authState: Maybe<Maybe<UserInfo>> = Maybe.nothing<Maybe<UserInfo>>();
    private subscribers: AuthCallback[] = [];
    private userInfo: UserInfo = null;
    private readonly ACCOUNT_ENDPOINT: string = '/api/user/account';
    private static INSTANCE: AuthState = null;
    private constructor() {
    }

    static getInstance(): AuthState {
        if (AuthState.INSTANCE == null) {
            AuthState.INSTANCE = new AuthState();
        }
        return AuthState.INSTANCE;
    }

    public subscribe(c: AuthCallback): void {
        this.subscribers.push(c);
    }

    private broadcast(newState: Maybe<UserInfo>): void {
        this.subscribers.forEach((c: AuthCallback) => c(newState));
    }

    public authorize(user: UserInfo): void {
        const newState: Maybe<UserInfo> = Maybe.just(user);
        this.authState = Maybe.just<Maybe<UserInfo>>(newState);
        this.broadcast(newState);
    }

    public deauthorize(): void {
        const newState: Maybe<UserInfo> = Maybe.nothing<UserInfo>();
        this.authState = Maybe.just<Maybe<UserInfo>>(newState);
        this.broadcast(newState);
    }

    public async getState(): Promise<Maybe<UserInfo>> {
        return await this.authState.caseOf({
            just: async (userOpt: Maybe<UserInfo>) => userOpt,
            nothing: async () => {
                let result: Maybe<UserInfo> = Maybe.nothing<UserInfo>();
                try {
                    const res = await $.ajax({
                        url: this.ACCOUNT_ENDPOINT,
                        method: 'post',
                        dataType: 'json'
                    });
                    this.authorize(res.data);
                    result = Maybe.just<UserInfo>(res.data);
                } catch (e) {
                    this.deauthorize();
                }
                return result;
            }
        });
    }
}
