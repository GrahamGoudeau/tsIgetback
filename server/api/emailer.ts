import { isProduction, DOMAIN_NAME, VERIFY_ENDPOINT } from './utils';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { LoggerModule } from './logger';

const log: LoggerModule = new LoggerModule('emailer');
const templateDir: string = `${__dirname}/../data/templates/`;
const doSend: boolean = process.env.MAIL_DEBUG === "true" || isProduction();
const fromAddress: string = process.env.MAIL_ADDR;
const transporter: nodemailer.Transporter = nodemailer.createTransport(`smtps://${process.env.MAIL_USER}%40gmail.com:${process.env.MAIL_PASS}@smtp.gmail.com`);

function compileFromTemplateSource(fileName: string): HandlebarsTemplateDelegate {
    return handlebars.compile(fs.readFileSync(`${templateDir}/${fileName}`, 'utf8'));
}

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
            verifyLink: `${DOMAIN_NAME}/${VERIFY_ENDPOINT}/${recordId}`
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
