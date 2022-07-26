import { ObjectSchema } from 'pip-services3-commons-nodex';
import { TypeCode } from 'pip-services3-commons-nodex';
import { CreditCardV1Schema } from './CreditCardV1Schema';
import { BankAccountV1Schema } from './BankAccountV1Schema';
import { AddressV1Schema } from './AddressV1Schema';

export class PaymentMethodV1Schema extends ObjectSchema {
    public constructor() {
        super();
        this.withOptionalProperty('id', TypeCode.String);
        this.withRequiredProperty('customer_id', TypeCode.String);

        this.withOptionalProperty('create_time', TypeCode.DateTime);
        this.withOptionalProperty('update_time', TypeCode.DateTime);

        this.withRequiredProperty('payout', TypeCode.Boolean);
        this.withRequiredProperty('type', TypeCode.String);
        this.withOptionalProperty('card', new CreditCardV1Schema());
        this.withOptionalProperty('account', new BankAccountV1Schema());
        this.withOptionalProperty('billing_address', new AddressV1Schema());

        this.withOptionalProperty('last4', TypeCode.String);
        this.withOptionalProperty('name', TypeCode.String);
        this.withOptionalProperty('saved', TypeCode.Boolean);
        this.withOptionalProperty('default', TypeCode.Boolean);
    }
}
