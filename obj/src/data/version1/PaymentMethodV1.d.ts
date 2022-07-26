import { IStringIdentifiable } from 'pip-services3-commons-nodex';
import { CreditCardV1 } from './CreditCardV1';
import { BankAccountV1 } from './BankAccountV1';
import { AddressV1 } from './AddressV1';
export declare class PaymentMethodV1 implements IStringIdentifiable {
    id: string;
    customer_id: string;
    create_time?: Date;
    update_time?: Date;
    payout: boolean;
    type: string;
    card?: CreditCardV1;
    account?: BankAccountV1;
    billing_address?: AddressV1;
    last4?: string;
    name?: string;
    saved?: boolean;
    default?: boolean;
}
