import { IStringIdentifiable } from 'pip-services3-commons-nodex';
import { CreditCardV1 } from './CreditCardV1';
import { BankAccountV1 } from './BankAccountV1';
import { AddressV1 } from './AddressV1';

export class PaymentMethodV1 implements IStringIdentifiable {
    public id: string;
    public customer_id: string;

    public create_time?: Date;
    public update_time?: Date;

    public payout: boolean;
    public type: string;
    public card?: CreditCardV1;
    public account?: BankAccountV1;
    public billing_address?: AddressV1;

    public last4?: string;
    public name?: string;
    public saved?: boolean;
    public default?: boolean;
}