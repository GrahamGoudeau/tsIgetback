import { Maybe } from 'tsmonad';

export type AuthCallback = (state: Maybe<UserInfo>) => void;

export interface UserInfo {
    firstName: string;
    lastName: string;
    email: string;
    authToken: string;
}

export class AuthState {
    private signedIn: Maybe<boolean> = Maybe.nothing<boolean>();
    private authState: Maybe<Maybe<UserInfo>> = Maybe.nothing<Maybe<UserInfo>>();
    private subscribers: AuthCallback[] = [];
    private readonly ONE_DAY: number = 86400000; // milliseconds
    private readonly ACCOUNT_ENDPOINT: string = '/api/user/account';
    private readonly COOKIE_PRELUDE: string = 'IgetbackAuth=';

    private static INSTANCE: AuthState = null;
    static getInstance(): AuthState {
        if (AuthState.INSTANCE == null) {
            AuthState.INSTANCE = new AuthState();
        }
        return AuthState.INSTANCE;
    }

    private constructor() {
    }


    public subscribe(c: AuthCallback): void {
        this.subscribers.push(c);
    }

    private broadcast(newState: Maybe<UserInfo>): void {
        this.subscribers.forEach((c: AuthCallback) => c(newState));
    }

    private getAllRegexMatches(input: string, pattern: string): string[] {
        const result: string[] = [];
        let m: RegExpExecArray = null;
        const regex: RegExp = new RegExp(pattern, 'g');
        do {
            m = regex.exec(input);
            if (m) {
                result.push(m[1]);
            }
        } while (m);
        return result;
    }

    private getAuthToken(cookie: string): Maybe<string> {
        const allMatches = this.getAllRegexMatches(cookie, `${this.COOKIE_PRELUDE}([a-f0-9]+)`);
        const cookieText: string = allMatches[allMatches.length - 1];
        if (!cookieText) {
            return Maybe.nothing<string>();
        }
        return Maybe.just<string>(cookieText);
    }

    public authorize(user: UserInfo): void {
        const expireDate: Date = new Date();
        expireDate.setTime(expireDate.getTime() + this.ONE_DAY * 2);

        document.cookie = `${this.COOKIE_PRELUDE}${user.authToken};path=/;expires=${expireDate};`;

        const newState: Maybe<UserInfo> = Maybe.just(user);
        this.authState = Maybe.just<Maybe<UserInfo>>(newState);
        this.broadcast(newState);
    }

    public deauthorize(): void {
        const newState: Maybe<UserInfo> = Maybe.nothing<UserInfo>();
        this.authState = Maybe.just<Maybe<UserInfo>>(newState);
        this.broadcast(newState);
        document.cookie += `; expires=${new Date(0)};`;
    }

    public async getState(): Promise<Maybe<UserInfo>> {
        return await this.authState.caseOf({
            just: async (userOpt: Maybe<UserInfo>) => userOpt,
            nothing: async () => {
                let result: Maybe<UserInfo> = Maybe.nothing<UserInfo>();
                try {
                    const res = await $.ajax({
                        url: this.ACCOUNT_ENDPOINT,
                        method: 'get',
                        dataType: 'json'
                    });
                    const cookieOpt: Maybe<string> = this.getAuthToken(document.cookie);
                    const userInfo: UserInfo = {
                        firstName: res.data.firstName,
                        lastName: res.data.lastName,
                        email: res.data.email,
                        authToken: cookieOpt.caseOf({
                            just: (c: string) => c,
                            nothing: () => {
                                throw new Error('Unexpected error- maybe was nothing');
                            }
                        })
                    };
                    this.authorize(userInfo);
                    result = Maybe.just<UserInfo>(userInfo);
                } catch (e) {
                    if (e.status !== 401) {
                        console.log('exception during process:', e);
                    }
                    this.deauthorize();
                }
                return result;
            }
        });
    }
}
