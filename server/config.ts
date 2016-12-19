import { LoggerModule } from './api/logger';

const log = new LoggerModule('config');
export class IGetBackConfig {
    private static INSTANCE: IGetBackConfig = null;
    public static getInstance() {
        if (IGetBackConfig.INSTANCE == null) {
            IGetBackConfig.INSTANCE = new IGetBackConfig(process.env);
        }
        return IGetBackConfig.INSTANCE;
    }

    private readonly boolType = 'boolean';
    private readonly stringType = 'string';
    private readonly numberType = 'number';

    private readonly registeredFields = {
        booleanFields: [
            'PRODUCTION',
            'MAIL_DEBUG',
            'LOG_DEBUG',
        ],
        stringFields: [
            'DB_USER',
            'DB_PASS',
            'PROD_DB_PREFIX',
            'PROD_DB_SUFFIX',
            'CRYPT_PASS',
            'MAIL_ADDR',
            'MAIL_USER',
            'MAIL_PASS',
            'DOMAIN_NAME',
            'VERIFY_ENDPOINT',
        ],
        numberFields: [
            'PORT'
        ]
    };
    private typeMapping = {};

    private constructor(private readonly env) {
        const checkKey = (k, type) => {
            if (env[k] == null) {
                log.INFO(`Config key ${k} of type '${type}' not set`);
            }
        };
        this.registeredFields.booleanFields.forEach(k => {
            checkKey(k, this.boolType);
            this.typeMapping[k] = this.boolType;
        });
        this.registeredFields.stringFields.forEach(k => {
            checkKey(k, this.stringType);
            this.typeMapping[k] = this.stringType;
        });
        this.registeredFields.numberFields.forEach(k => {
            checkKey(k, this.numberType);
            this.typeMapping[k] = this.numberType;
        });
    };

    private getConfig(key: string, returnType: 'boolean' | 'string' | 'number'): boolean | string | number {
        if (this.env[key] == null) {
            throw new Error(`Config key ${key} not set`);
        } else if (this.typeMapping[key] == null) {
            throw new Error(`Config key ${key} not registered in config.ts`);
        } else if (this.typeMapping[key] !== returnType) {
            throw new Error(`Config key ${key} not of type '${returnType}'`);
        }

        const value: string = this.env[key];
        if (returnType === 'boolean') {
            if (value === 'true') {
                return true;
            } else if (value === 'false') {
                return false;
            } else {
                throw new Error(`Config key ${key} set but invalid value '${value}' for type '${returnType}'`);
            }
        } else if (returnType === 'string') {
            return value;
        } else if (returnType === 'number') {
            const result: number = Number(value);
            if (value === '' || isNaN(result)) {
                throw new Error(`Config key ${key} set to '${value}' which is not of type integer`);
            }
            return result;
        }
    }

    public getBooleanConfig(key: string): boolean {
        return this.getConfig(key, 'boolean') as boolean;
    }

    public getBooleanConfigDefault(key: string, other: boolean): boolean {
        if (!this.isConfigSet(key)) {
            return other;
        }
        return this.getBooleanConfig(key);
    }

    public getStringConfig(key: string): string {
        return this.getConfig(key, 'string') as string;
    }

    public getStringConfigDefault(key: string, other: string): string {
        if (!this.isConfigSet(key)) {
            return other;
        }
        return this.getStringConfig(key);
    }

    public getNumberConfig(key: string): number {
        return this.getConfig(key, 'number') as number;
    }

    public getNumberConfigDefault(key: string, other: number): number {
        if (!this.isConfigSet(key)) {
            return other;
        }
        return this.getNumberConfig(key);
    }

    public isConfigSet(key: string): boolean {
        return this.env[key] != null;
    }
}
