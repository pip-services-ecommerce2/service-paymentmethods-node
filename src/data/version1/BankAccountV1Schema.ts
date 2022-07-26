import { ObjectSchema } from 'pip-services3-commons-nodex';
import { TypeCode } from 'pip-services3-commons-nodex';

export class BankAccountV1Schema extends ObjectSchema {
    public constructor() {
        super();
        this.withRequiredProperty('bank_code', TypeCode.String);
        this.withOptionalProperty('branch_code', TypeCode.String);
        this.withRequiredProperty('number', TypeCode.String);
        this.withRequiredProperty('routing_number', TypeCode.String);
        this.withRequiredProperty('currency', TypeCode.String);
        this.withRequiredProperty('first_name', TypeCode.String);
        this.withRequiredProperty('last_name', TypeCode.String);
        this.withOptionalProperty('country', TypeCode.String);
    }
}
