import { IStripeConnector } from "../IStripeConnector";
import { FilterParams, IReferences } from "pip-services3-commons-nodex";
import { DataPage } from "pip-services3-commons-nodex";
import { PagingParams } from "pip-services3-commons-nodex";

import { ConfigParams } from "pip-services3-commons-nodex";
import { Stripe } from "stripe";
import { isString } from "util";
import { StripeOptions } from "../StripeOptions";
import { ConnectionResolver } from 'pip-services3-components-nodex';
import { ConnectionParams } from 'pip-services3-components-nodex';
import { CredentialResolver } from 'pip-services3-components-nodex';
import { CredentialParams } from 'pip-services3-components-nodex';
import { CompositeLogger } from 'pip-services3-components-nodex';

import { PaymentMethodV1 } from "../../data/version1";
import { PaymentMethodTypeV1 } from "../../data/version1";
import { AddressV1 } from "../../data/version1";
import { StripeTools } from "./StripeTools";

export class StripeBankAccountsConnector implements IStripeConnector {
    private _client: Stripe = null;

    private _connectionResolver: ConnectionResolver = new ConnectionResolver();
    private _credentialsResolver: CredentialResolver = new CredentialResolver();

    private _logger: CompositeLogger = new CompositeLogger();

    public constructor() { }

    public configure(config: ConfigParams): void {
        this._logger.configure(config);
        this._connectionResolver.configure(config);
        this._credentialsResolver.configure(config);
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._credentialsResolver.setReferences(references);
    }

    public isOpen(): boolean {
        return this._client != null;
    }

    public async open(correlationId: string): Promise<void> {
        let connectionParams: ConnectionParams;
        let credentialParams: CredentialParams;

        // Get connection params
        connectionParams = await this._connectionResolver.resolve(correlationId);

        // Get credential params
        credentialParams = await this._credentialsResolver.lookup(correlationId);

        // Connect
        let stripeOptions = new StripeOptions(connectionParams);
        let secretKey = credentialParams.getAccessKey();

        this._client = new Stripe(secretKey, {
            apiVersion: stripeOptions.apiVersion,
            maxNetworkRetries: stripeOptions.maxNetworkRetries,
            httpAgent: stripeOptions.httpAgent,
            timeout: stripeOptions.timeout,
            host: stripeOptions.host,
            port: stripeOptions.port,
            protocol: stripeOptions.protocol,
            telemetry: stripeOptions.telemetry
        });
    }

    public async close(correlationId: string): Promise<void> {
        this._client = null;
    }

    async getPageByFilterAsync(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>> {
        let customer_id = filter?.getAsString('customer_id');
        let customerId: string = customer_id ? await this.fromPublicCustomerAsync(customer_id) : null;

        let skip = paging.getSkip(0);
        let take = paging.getTake(100);

        let ids = customerId ? [customerId] : await this.getAllCustomerIds();

        let data: PaymentMethodV1[] = [];

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];

            let items = await this._client.customers.listSources(id, {
                object: 'bank_account',
                limit: skip + take,
                // expand: ['data.metadata']
            });

            for (let j = 0; j < items.data.length; j++) {
                const item = items.data[j];
                data.push(await this.toPublicAsync(item as Stripe.BankAccount));
            }
        }

        return new DataPage(data);
    }

    async getByIdAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        var customer_id = await this.fromPublicCustomerAsync(customerId);

        let customerSource: Stripe.CustomerSource =
            await StripeTools.errorSuppression(this._client.customers.retrieveSource(customer_id, id, {
                expand: ['metadata']
            }));

        return customerSource ? await this.toPublicAsync(customerSource as Stripe.BankAccount) : null;
    }

    async createAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var customerId = await this.getCustomerIdAsync(item);

        let account = item.account;

        let bankToken = await this._client.tokens.create({
            bank_account: {
                account_number: account.number,
                country: account.country,
                currency: account.currency,
                account_holder_name: account.first_name + ' ' + account.last_name,
                account_holder_type: 'individual',
                routing_number: account.routing_number
            },
        });

        let customerSource = await this._client.customers.createSource(customerId, {
            source: bankToken.id,
            metadata: this.toMetadata(item),
        });

        return await this.toPublicAsync(customerSource as Stripe.BankAccount);
    }

    async updateAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var customerId = await this.getCustomerIdAsync(item);

        let account = item.account;

        // Updates the account_holder_name, account_holder_type, and metadata of a bank account belonging to a customer. 
        // Other bank account details are not editable, by design.
        let customerSource = await this._client.customers.updateSource(customerId, item.id, {
            account_holder_name: account.first_name + ' ' + account.last_name,
            account_holder_type: 'individual',
            metadata: this.toMetadata(item),
        });

        return await this.toPublicAsync(customerSource as Stripe.BankAccount);
    }

    async deleteAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        var customer_id = await this.fromPublicCustomerAsync(customerId);

        let customerSource = await StripeTools.errorSuppression(this._client.customers.deleteSource(customer_id, id, {
            expand: ['metadata']
        }));

        return customerSource ? await this.toPublicAsync(customerSource as Stripe.BankAccount) : null;
    }

    async clearAsync(correlationId: string): Promise<void> {
        let filter = new FilterParams();
        let paging = new PagingParams(0, 100);

        let page = await this.getPageByFilterAsync(correlationId, filter, paging);

        for (let i = 0; i < page.data.length; i++) {
            const paymentMethod = page.data[i];
            await this.deleteAsync(correlationId, paymentMethod.id, paymentMethod.customer_id);
        }
    }

    private async getCustomerIdAsync(item: PaymentMethodV1): Promise<string> {
        var customerId = await this.fromPublicCustomerAsync(item.customer_id);
        if (customerId == null) {
            var customer = await this._client.customers.create({
                metadata: {
                    'customer_id': item.customer_id
                }
            });

            customerId = customer.id;
        }

        return customerId;
    }

    private async toPublicAsync(item: Stripe.BankAccount): Promise<PaymentMethodV1> {

        let customer_id = await this.toPublicCustomerAsync(isString(item.customer) ? item.customer : item.customer?.id);

        var method: PaymentMethodV1 = {
            id: item.id,
            payout: false,
            account: {
                number: item.account?.toString(),
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
            type: PaymentMethodTypeV1.BankAccount,
        };

        this.fromMetadata(method, item.metadata);

        return method;
    }

    private async toPublicCustomerAsync(customer_id: string): Promise<string> {
        if (customer_id) {
            let item = await this._client.customers.retrieve(customer_id, {});

            let customer = item as Stripe.Customer;
            if (customer) {
                return customer.metadata['customer_id']?.toString();
            }
        }
        return null;
    }

    private async fromPublicCustomerAsync(customer_id: string): Promise<string> {
        if (customer_id) {
            var customers = await this._client.customers.list({});

            for (let index = 0; index < customers.data.length; index++) {
                const customer = customers.data[index];
                if (customer.metadata['customer_id'] == customer_id) {
                    return customer.id;
                }
            }
        }
        return null;
    }

    private async getAllCustomerIds(): Promise<string[]> {
        let ids: string[] = [];
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
                var items = await this._client.customers.list(options)

            ids.push(...items.data.map((item, index, array) => item.id));
        }
        while (items.has_more);

        return ids;
    }

    private toMetadata(item: PaymentMethodV1): Stripe.MetadataParam {
        let account = item.account;
        let address = item.billing_address || new AddressV1();

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
        }
    }

    private fromMetadata(item: PaymentMethodV1, metadata: Stripe.MetadataParam) {
        if (metadata) {
            item.default = metadata['default'] == 'true';
            item.saved = metadata['saved'] == 'true';
            item.name = metadata['name']?.toString();

            item.account.first_name = metadata['first_name']?.toString();
            item.account.last_name = metadata['last_name']?.toString();
            item.account.bank_code = metadata['bank_code']?.toString();
            item.account.branch_code = metadata['branch_code']?.toString();

            item.billing_address = {
                city: metadata['address_city']?.toString(),
                country_code: metadata['address_country_code']?.toString(),
                line1: metadata['address_line1']?.toString(),
                line2: metadata['address_line2']?.toString(),
                postal_code: metadata['address_postal_code']?.toString(),
                state: metadata['address_state']?.toString(),
            };
        }
    }
}