"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodV1Schema = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const CreditCardV1Schema_1 = require("./CreditCardV1Schema");
const BankAccountV1Schema_1 = require("./BankAccountV1Schema");
const AddressV1Schema_1 = require("./AddressV1Schema");
class PaymentMethodV1Schema extends pip_services3_commons_nodex_1.ObjectSchema {
    constructor() {
        super();
        this.withOptionalProperty('id', pip_services3_commons_nodex_2.TypeCode.String);
        this.withRequiredProperty('customer_id', pip_services3_commons_nodex_2.TypeCode.String);
        this.withOptionalProperty('create_time', pip_services3_commons_nodex_2.TypeCode.DateTime);
        this.withOptionalProperty('update_time', pip_services3_commons_nodex_2.TypeCode.DateTime);
        this.withRequiredProperty('payout', pip_services3_commons_nodex_2.TypeCode.Boolean);
        this.withRequiredProperty('type', pip_services3_commons_nodex_2.TypeCode.String);
        this.withOptionalProperty('card', new CreditCardV1Schema_1.CreditCardV1Schema());
        this.withOptionalProperty('account', new BankAccountV1Schema_1.BankAccountV1Schema());
        this.withOptionalProperty('billing_address', new AddressV1Schema_1.AddressV1Schema());
        this.withOptionalProperty('last4', pip_services3_commons_nodex_2.TypeCode.String);
        this.withOptionalProperty('name', pip_services3_commons_nodex_2.TypeCode.String);
        this.withOptionalProperty('saved', pip_services3_commons_nodex_2.TypeCode.Boolean);
        this.withOptionalProperty('default', pip_services3_commons_nodex_2.TypeCode.Boolean);
    }
}
exports.PaymentMethodV1Schema = PaymentMethodV1Schema;
//# sourceMappingURL=PaymentMethodV1Schema.js.map