import { ObjectSchema } from 'pip-services3-commons-nodex';
import { TypeCode } from 'pip-services3-commons-nodex';

export class CreditCardV1Schema extends ObjectSchema {
    public constructor() {
        super();
        this.withRequiredProperty('brand', TypeCode.String);
        this.withRequiredProperty('number', TypeCode.String);
        this.withRequiredProperty('expire_month', TypeCode.Integer);
        this.withRequiredProperty('expire_year', TypeCode.Integer);
        this.withRequiredProperty('first_name', TypeCode.String);
        this.withRequiredProperty('last_name', TypeCode.String);
        this.withOptionalProperty('state', TypeCode.String);
        this.withOptionalProperty('ccv', TypeCode.String);
    }
}
