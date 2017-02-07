import { browserHistory } from 'react-router';

export const goToUrl = (url: string, event?: any) => {
    if (!event) {
        return (event: any) => {
            event.preventDefault();
            browserHistory.push(url)
        }
    }

    event.preventDefault();
    browserHistory.push(url);
};

export function showOrHide(p: boolean) {
    if (p) {
        return '';
    }
    return 'hidden';
}

export function updateState<T, K extends keyof T>(state: T, key: K, value: T[K]): T {
    const update: any = {};
    update[key] = value;
    return Object.assign({}, state, update);
}
