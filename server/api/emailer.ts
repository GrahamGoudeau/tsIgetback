import { o } from './utils';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { LoggerModule } from './logger';
import { IGetBackConfig } from '../config';

const log: LoggerModule = new LoggerModule('emailer');
const templateDir: string = `${__dirname}/../data/templates/`;
const config = IGetBackConfig.getInstance();
const domainName = config.getStringConfig('DOMAIN_NAME');
const verifyEndpoint = config.getStringConfig('VERIFY_ENDPOINT');

const doSend: boolean = config.getBooleanConfigDefault('MAIL_DEBUG', false) || config.getBooleanConfigDefault('PRODUCTION', false);
const fromAddress: string = config.getStringConfigDefault('MAIL_ADDR', '');
const mailUser: string = config.getStringConfigDefault('MAIL_USER', '');
const mailPass: string = config.getStringConfigDefault('MAIL_PASS', '');
const transporter: nodemailer.Transporter = nodemailer.createTransport(`smtps://${mailUser}%40gmail.com:${mailPass}@smtp.gmail.com`);

const compileFromTemplateSource: (fileName: string) => HandlebarsTemplateDelegate
        = o(handlebars.compile, x => fs.readFileSync(`${templateDir}/${x}`, 'utf8'));

const templates = {
    'userVerification': compileFromTemplateSource('userVerification.html')
}

export function userVerification(firstName: string, email: string, recordId: string): Promise<boolean> {
    if (!doSend) {
        log.INFO('Email sending disabled- did not send to', email);
        return Promise.resolve(false);
    }

    const mailOptions = {
        from: fromAddress,
        to: email,
        subject: 'Verify Your IGetBack Account',
        html: templates.userVerification({
            firstName: firstName,
            verifyLink: `${domainName}/${verifyEndpoint}/${recordId}`
        })
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                log.INFO('Could not send email to', email, error);
                resolve(false);
            }
            resolve(true);
        });
    });
}
