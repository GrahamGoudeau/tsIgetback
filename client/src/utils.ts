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

