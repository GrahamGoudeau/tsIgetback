import { o } from '../utils/functionalUtils';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { LoggerModule } from './logger';
import { IGetBackConfig } from '../config';
import * as SparkPost from 'sparkpost';
import { getDateString } from '../utils/functionalUtils';

const templateDir: string = `${__dirname}/../data/templates/`;

const compileFromTemplateSource: (fileName: string) => HandlebarsTemplateDelegate
        = o(handlebars.compile, x => fs.readFileSync(`${templateDir}/${x}`, 'utf8'));

const templates = {
    'userVerification': compileFromTemplateSource('userVerification.html'),
    'errorReport': compileFromTemplateSource('errorReport.html'),
    'subscriberNotification': compileFromTemplateSource('subscriberNotification.html'),
}

export interface IEmailer {
    userVerification: (firstName: string, email: string, recordId: string) => Promise<boolean>;
    errorAlert: (message: string) => Promise<void>;
    subscriberNotification: (recipients: string[], origin: string, destination: string, tripDate: Date, tripHour: number, tripQuarterHour: number, contactEmail: string) => Promise<void>
}

class ProductionEmailer implements IEmailer {
    private readonly fromAddress: string = null;
    private readonly domainName: string = null;
    private readonly verifyEndpoint: string = null;

    private readonly sparkPostClient = null;
    private readonly errorAddress: string = null;
    private readonly log: LoggerModule = null;

    private static INSTANCE: ProductionEmailer = null;
    public static getInstance(): ProductionEmailer {
        if (ProductionEmailer.INSTANCE == null) {
            ProductionEmailer.INSTANCE = new ProductionEmailer();
        }
        return ProductionEmailer.INSTANCE;
    }

    private constructor() {
        this.log = new LoggerModule('production-emailer');
        this.log.INFO('Using production emailer');
        const config = IGetBackConfig.getInstance();
        this.fromAddress = config.getStringConfig('MAIL_ADDR');
        this.domainName = config.getStringConfig('DOMAIN_NAME');
        this.verifyEndpoint = config.getStringConfig('VERIFY_ENDPOINT');

        this.sparkPostClient = new SparkPost(config.getStringConfig('SPARKPOST_API_KEY'));
        this.errorAddress = config.getStringConfig('LOG_ADDR');
    }

    public async errorAlert(message: string): Promise<void> {
        await this.sparkPostClient.transmissions.send({
            content: {
                from: this.fromAddress,
                subject: 'IGETBACK ERROR LOGGED',
                html: templates.errorReport({
                    errorDate: new Date(),
                    errorMessage: message
                })
            },
            recipients: [
                {address: this.errorAddress}
            ]
        });
    }

    public async subscriberNotification(recipients: string[], origin: string, destination: string, tripDate: Date, tripHour: number, tripQuarterHour: number, contactEmail: string): Promise<void> {
        if (recipients.length == 0) {
            this.log.DEBUG('No recipients for notifications');
            return;
        }

        try {
            const toAddresses: {address: string}[] = recipients.map((recipient: string) => {
                return {
                    address: recipient
                };
            });
            const sendTripHour: string = `${tripHour > 12 ? (tripHour - 12) : tripHour}`;
            const amOrPm: string = `${tripHour > 12 ? 'PM' : 'AM'}`;
            console.log(toAddresses);
            const res = await this.sparkPostClient.transmissions.send({
                content: {
                    from: this.fromAddress,
                    subject: 'IGetBack Notification',
                    html: templates.subscriberNotification({
                        origin: origin,
                        destination: destination,
                        tripDate: getDateString(tripDate),
                        tripHour: sendTripHour,
                        tripQuarterHour: tripQuarterHour,
                        contactEmail: contactEmail,
                        amOrPm: amOrPm
                    })
                },
                recipients: toAddresses
            });
            if (res.results.total_accepted_recipients !== recipients.length) {
                this.log.ERROR('Failed to send all notifications to subscribers');
            }
        } catch (e) {
            this.log.ERROR('Exception sending notifications:', e.message);
        }
    }

    public async userVerification(firstName: string, email: string, recordId: string): Promise<boolean> {
        try {
            const res = await this.sparkPostClient.transmissions.send({
                content: {
                    from: this.fromAddress,
                    subject: 'Verify Your IGetBack Account',
                    html: templates.userVerification({
                        firstName: firstName,
                        verifyLink: `${this.domainName}/${this.verifyEndpoint}/${recordId}`
                    }),
                },
                recipients: [
                    {address: email}
                ]
            });
            return res.results.total_accepted_recipients === 1;
        } catch (e) {
            this.log.ERROR('Exception while sending');
            console.log(e);
            return false;
        }
    }
}

class DisabledEmailer implements IEmailer {
    private static INSTANCE: DisabledEmailer = null;
    private readonly log: LoggerModule = null;
    public static getInstance(): DisabledEmailer {
        if (DisabledEmailer.INSTANCE == null) {
            DisabledEmailer.INSTANCE = new DisabledEmailer();
        }
        return DisabledEmailer.INSTANCE;
    }

    private constructor() {
        this.log = new LoggerModule('disabled-emailer');
        this.log.INFO('Using disabled emailer');
    }

    public async userVerification(firstName: string, email: string, recordId: string): Promise<boolean> {
        this.log.INFO('Not sending user verification email to', email);
        return false;
    }

    public async errorAlert(message: string) {
        this.log.INFO('Not sending error alert email');
    }

    public async subscriberNotification(recipients: string[], origin: string, destination: string, tripDate: Date, tripHour: number, tripQuarterHour: number, contactEmail: string): Promise<void> {
        this.log.INFO('Not notifying subscribers');
    }
}

export function getEmailerInstance(): IEmailer {
    const config = IGetBackConfig.getInstance();
    const doSend: boolean = config.getBooleanConfigDefault('MAIL_DEBUG', false) ||
        config.getBooleanConfigDefault('PRODUCTION', false);
    if (doSend) {
        return ProductionEmailer.getInstance();
    } else {
        return DisabledEmailer.getInstance();
    }
}
