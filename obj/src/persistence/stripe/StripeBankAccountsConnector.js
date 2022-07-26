"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeBankAccountsConnector = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const stripe_1 = require("stripe");
const util_1 = require("util");
const StripeOptions_1 = require("../StripeOptions");
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_2 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_3 = require("pip-services3-components-nodex");
const version1_1 = require("../../data/version1");
const version1_2 = require("../../data/version1");
const StripeTools_1 = require("./StripeTools");
class StripeBankAccountsConnector {
    constructor() {
        this._client = null;
        this._connectionResolver = new pip_services3_components_nodex_1.ConnectionResolver();
        this._credentialsResolver = new pip_services3_components_nodex_2.CredentialResolver();
        this._logger = new pip_services3_components_nodex_3.CompositeLogger();
    }
    configure(config) {
        this._logger.configure(config);
        this._connectionResolver.configure(config);
        this._credentialsResolver.configure(config);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._credentialsResolver.setReferences(references);
    }
    isOpen() {
        return this._client != null;
    }
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let connectionParams;
            let credentialParams;
            // Get connection params
            connectionParams = yield this._connectionResolver.resolve(correlationId);
            // Get credential params
            credentialParams = yield this._credentialsResolver.lookup(correlationId);
            // Connect
            let stripeOptions = new StripeOptions_1.StripeOptions(connectionParams);
            let secretKey = credentialParams.getAccessKey();
            this._client = new stripe_1.Stripe(secretKey, {
                apiVersion: stripeOptions.apiVersion,
                maxNetworkRetries: stripeOptions.maxNetworkRetries,
                httpAgent: stripeOptions.httpAgent,
                timeout: stripeOptions.timeout,
                host: stripeOptions.host,
                port: stripeOptions.port,
                protocol: stripeOptions.protocol,
                telemetry: stripeOptions.telemetry
            });
        });
    }
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            this._client = null;
        });
    }
    getPageByFilterAsync(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            let customer_id = filter === null || filter === void 0 ? void 0 : filter.getAsString('customer_id');
            let customerId = customer_id ? yield this.fromPublicCustomerAsync(customer_id) : null;
            let skip = paging.getSkip(0);
            let take = paging.getTake(100);
            let ids = customerId ? [customerId] : yield this.getAllCustomerIds();
            let data = [];
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                let items = yield this._client.customers.listSources(id, {
                    object: 'bank_account',
                    limit: skip + take,
                    // expand: ['data.metadata']
                });
                for (let j = 0; j < items.data.length; j++) {
                    const item = items.data[j];
                    data.push(yield this.toPublicAsync(item));
                }
            }
            return new pip_services3_commons_nodex_2.DataPage(data);
        });
    }
    getByIdAsync(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var customer_id = yield this.fromPublicCustomerAsync(customerId);
            let customerSource = yield StripeTools_1.StripeTools.errorSuppression(this._client.customers.retrieveSource(customer_id, id, {
                expand: ['metadata']
            }));
            return customerSource ? yield this.toPublicAsync(customerSource) : null;
        });
    }
    createAsync(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customerId = yield this.getCustomerIdAsync(item);
            let account = item.account;
            let bankToken = yield this._client.tokens.create({
                bank_account: {
                    account_number: account.number,
                    country: account.country,
                    currency: account.currency,
                    account_holder_name: account.first_name + ' ' + account.last_name,
                    account_holder_type: 'individual',
                    routing_number: account.routing_number
                },
            });
            let customerSource = yield this._client.customers.createSource(customerId, {
                source: bankToken.id,
                metadata: this.toMetadata(item),
            });
            return yield this.toPublicAsync(customerSource);
        });
    }
    updateAsync(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customerId = yield this.getCustomerIdAsync(item);
            let account = item.account;
            // Updates the account_holder_name, account_holder_type, and metadata of a bank account belonging to a customer. 
            // Other bank account details are not editable, by design.
            let customerSource = yield this._client.customers.updateSource(customerId, item.id, {
                account_holder_name: account.first_name + ' ' + account.last_name,
                account_holder_type: 'individual',
                metadata: this.toMetadata(item),
            });
            return yield this.toPublicAsync(customerSource);
        });
    }
    deleteAsync(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var customer_id = yield this.fromPublicCustomerAsync(customerId);
            let customerSource = yield StripeTools_1.StripeTools.errorSuppression(this._client.customers.deleteSource(customer_id, id, {
                expand: ['metadata']
            }));
            return customerSource ? yield this.toPublicAsync(customerSource) : null;
        });
    }
    clearAsync(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let filter = new pip_services3_commons_nodex_1.FilterParams();
            let paging = new pip_services3_commons_nodex_3.PagingParams(0, 100);
            let page = yield this.getPageByFilterAsync(correlationId, filter, paging);
            for (let i = 0; i < page.data.length; i++) {
                const paymentMethod = page.data[i];
                yield this.deleteAsync(correlationId, paymentMethod.id, paymentMethod.customer_id);
            }
        });
    }
    getCustomerIdAsync(item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customerId = yield this.fromPublicCustomerAsync(item.customer_id);
            if (customerId == null) {
                var customer = yield this._client.customers.create({
                    metadata: {
                        'customer_id': item.customer_id
                    }
                });
                customerId = customer.id;
            }
            return customerId;
        });
    }
    toPublicAsync(item) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let customer_id = yield this.toPublicCustomerAsync((0, util_1.isString)(item.customer) ? item.customer : (_a = item.customer) === null || _a === void 0 ? void 0 : _a.id);
            var method = {
                id: item.id,
                payout: false,
                account: {
                    number: (_b = item.account) === null || _b === void 0 ? void 0 : _b.toString(),
                    routing_number: item.routing_number,
                    country: item.country,
                    currency: item.currency,
                    //  fill from metadata
                    bank_code: '',
                    first_name: '',
                    last_name: '',
                    branch_code: ''
                },
                last4: item.last4,
                customer_id: customer_id,
                type: version1_1.PaymentMethodTypeV1.BankAccount,
            };
            this.fromMetadata(method, item.metadata);
            return method;
        });
    }
    toPublicCustomerAsync(customer_id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (customer_id) {
                let item = yield this._client.customers.retrieve(customer_id, {});
                let customer = item;
                if (customer) {
                    return (_a = customer.metadata['customer_id']) === null || _a === void 0 ? void 0 : _a.toString();
                }
            }
            return null;
        });
    }
    fromPublicCustomerAsync(customer_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (customer_id) {
                var customers = yield this._client.customers.list({});
                for (let index = 0; index < customers.data.length; index++) {
                    const customer = customers.data[index];
                    if (customer.metadata['customer_id'] == customer_id) {
                        return customer.id;
                    }
                }
            }
            return null;
        });
    }
    getAllCustomerIds() {
        return __awaiter(this, void 0, void 0, function* () {
            let ids = [];
            let pageSize = 100;
            do {
                let options = ids.length == 0
                    ? {
                        limit: pageSize
                    }
                    : {
                        limit: pageSize,
                        starting_after: ids[ids.length - 1]
                    };
                if (ids.length == 0)
                    var items = yield this._client.customers.list(options);
                ids.push(...items.data.map((item, index, array) => item.id));
            } while (items.has_more);
            return ids;
        });
    }
    toMetadata(item) {
        let account = item.account;
        let address = item.billing_address || new version1_2.AddressV1();
        return {
            'default': item.default ? 'true' : 'false',
            'saved': item.saved ? 'true' : 'false',
            'name': item.name,
            'bank_code': account.bank_code,
            'branch_code': account.branch_code,
            'first_name': account.first_name,
            'last_name': account.last_name,
            'address_city': address.city,
            'address_country_code': address.country_code,
            'address_line1': address.line1,
            'address_line2': address.line2,
            'address_postal_code': address.postal_code,
            'address_state': address.state,
        };
    }
    fromMetadata(item, metadata) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (metadata) {
            item.default = metadata['default'] == 'true';
            item.saved = metadata['saved'] == 'true';
            item.name = (_a = metadata['name']) === null || _a === void 0 ? void 0 : _a.toString();
            item.account.first_name = (_b = metadata['first_name']) === null || _b === void 0 ? void 0 : _b.toString();
            item.account.last_name = (_c = metadata['last_name']) === null || _c === void 0 ? void 0 : _c.toString();
            item.account.bank_code = (_d = metadata['bank_code']) === null || _d === void 0 ? void 0 : _d.toString();
            item.account.branch_code = (_e = metadata['branch_code']) === null || _e === void 0 ? void 0 : _e.toString();
            item.billing_address = {
                city: (_f = metadata['address_city']) === null || _f === void 0 ? void 0 : _f.toString(),
                country_code: (_g = metadata['address_country_code']) === null || _g === void 0 ? void 0 : _g.toString(),
                line1: (_h = metadata['address_line1']) === null || _h === void 0 ? void 0 : _h.toString(),
                line2: (_j = metadata['address_line2']) === null || _j === void 0 ? void 0 : _j.toString(),
                postal_code: (_k = metadata['address_postal_code']) === null || _k === void 0 ? void 0 : _k.toString(),
                state: (_l = metadata['address_state']) === null || _l === void 0 ? void 0 : _l.toString(),
            };
        }
    }
}
exports.StripeBankAccountsConnector = StripeBankAccountsConnector;
//# sourceMappingURL=StripeBankAccountsConnector.js.map