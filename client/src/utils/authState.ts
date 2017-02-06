import { Maybe } from 'tsmonad';

export type AuthCallback = (value: boolean) => void;

export class AuthState {
    private signedIn: Maybe<boolean> = Maybe.nothing<boolean>();
    private subscribers: AuthCallback[] = [];
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

    public setState(value: boolean): void {
        this.signedIn = Maybe.just<boolean>(value);
        this.subscribers.forEach((c: AuthCallback) => c(value));
    }

    public async getState(): Promise<boolean> {
        const signedInState: boolean = await this.signedIn.caseOf({
            just: async (b: boolean) => b,
            nothing: async () => {
                let result: boolean;
                try {
                    const res = await $.ajax({
                        url: 'http://localhost:5000/api/user',
                        method: 'post',
                        dataType: 'json'
                    });
                    result = res.test == null;
                } catch (e) {
                    result = false;
                }
                this.setState(result);
                return result;
            }
        });

        return signedInState;
    }
}
