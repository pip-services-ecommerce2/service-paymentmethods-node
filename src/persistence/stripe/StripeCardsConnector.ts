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

export class StripeCardsConnector implements IStripeConnector {
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

            let items = await this._client.paymentMethods.list({
                customer: id,
                type: "card",
                //starting_after: skip,
                limit: skip + take,
                expand: ['data.billing_details', 'data.card']
            });

            for (let j = 0; j < items.data.length; j++) {
                const item = items.data[j];
                data.push(await this.toPublicAsync(item));
            }
        }

        return new DataPage(data);
    }

    async getByIdAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        var customer_id = await this.fromPublicCustomerAsync(customerId);

        let paymentMethod = await StripeTools.errorSuppression(this._client.paymentMethods.retrieve(id, {
            expand: ['billing_details', 'card']
        }));

        return paymentMethod && paymentMethod.customer == customer_id
            ? await this.toPublicAsync(paymentMethod)
            : null;
    }

    async createAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var customerId = await this.fromPublicCustomerAsync(item.customer_id);
        if (customerId == null) {
            var customer = await this._client.customers.create({
                description: [item.card.first_name ?? '', item.card.last_name ?? ''].join(' '),
                metadata: {
                    'customer_id': item.customer_id
                }
            });

            customerId = customer.id;
        }

        let card = item.card;
        let address = item.billing_address || new AddressV1();

        let paymentMethod = await this._client.paymentMethods.create({
            type: 'card',
            card: {
                exp_month: card.expire_month,
                exp_year: card.expire_year,
                number: card.number,
                cvc: card.ccv
            },
            billing_details: {
                address: {
                    city: address.city,
                    country: address.country_code,
                    line1: address.line1,
                    line2: address.line2,
                    postal_code: address.postal_code,
                    state: address.state
                },
                name: card.first_name + ' ' + card.last_name,
            },
            metadata: this.toMetadata(item),
        });

        paymentMethod = await this._client.paymentMethods.attach(paymentMethod.id, { customer: customerId });

        return await this.toPublicAsync(paymentMethod);
    }

    async updateAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        let card = item.card;
        let address = item.billing_address;

        let updateParams: Stripe.PaymentMethodUpdateParams = {
            card: {
                exp_month: card.expire_month,
                exp_year: card.expire_year,
            },
            metadata: this.toMetadata(item),
        };

        if (address.city || address.country_code || address.line1) {
            updateParams.billing_details = {
                address: {
                    city: address?.city ?? '',
                    country: address?.country_code,
                    line1: address?.line1 ?? '',
                    line2: address?.line2 ?? '',
                    postal_code: address?.postal_code ?? '',
                    state: address?.state ?? ''
                },
                name: card.first_name + ' ' + card.last_name
            };
        }

        let paymentMethod = await this._client.paymentMethods.update(item.id, updateParams);

        return await this.toPublicAsync(paymentMethod);
    }

    async deleteAsync(correlationId: string, id: string) {
        let paymentMethod = await StripeTools.errorSuppression(this._client.paymentMethods.detach(id, {
            expand: ['billing_details', 'card']
        }));

        return paymentMethod ? await this.toPublicAsync(paymentMethod) : null;
    }

    async clearAsync(correlationId: string): Promise<void> {
        let filter = new FilterParams();
        let paging = new PagingParams(0, 100);

        let page = await this.getPageByFilterAsync(correlationId, filter, paging);

        for (let i = 0; i < page.data.length; i++) {
            const paymentMethod = page.data[i];
            await this.deleteAsync(correlationId, paymentMethod.id);
        }
    }

    private async toPublicAsync(item: Stripe.PaymentMethod): Promise<PaymentMethodV1> {
        let customer_id = await this.toPublicCustomerAsync(isString(item.customer) ? item.customer : item.customer?.id);

        var method: PaymentMethodV1 = {
            id: item.id,
            payout: false,
            type: PaymentMethodTypeV1.Card,
            customer_id: customer_id,
            card: {
                expire_month: item.card.exp_month,
                expire_year: item.card.exp_year,
                number: item.card.last4,
                ccv: ''
            },
            last4: item.card.last4,
            billing_address: {
                city: item.billing_details.address.city,
                country_code: item.billing_details.address.country,
                line1: item.billing_details.address.line1,
                line2: item.billing_details.address.line2,
                postal_code: item.billing_details.address.postal_code,
                state: item.billing_details.address.state
            },
            create_time: new Date(item.created),
        };

        this.fromMetadata(method, item.metadata);

        return method;
    }

    private async toPublicCustomerAsync(customer_id: string): Promise<string> {
        if (customer_id) {
            let item = await this._client.customers.retrieve(customer_id, {});

            let customer = item as Stripe.Customer;
            if (customer) {
                return customer.metadata['customer_id'].toString();
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
        let card = item.card;

        return {
            'default': item.default ? 'true' : 'false',
            'saved': item.saved ? 'true' : 'false',
            'name': item.name,

            'first_name': card.first_name,
            'last_name': card.last_name,
            'brand': card.brand,
            'state': card.state
        }
    }

    private fromMetadata(item: PaymentMethodV1, metadata: Stripe.MetadataParam) {
        if (metadata) {
            item.default = metadata['default'] == 'true';
            item.saved = metadata['saved'] == 'true';
            item.name = metadata['name']?.toString();

            item.card.first_name = metadata['first_name']?.toString();
            item.card.last_name = metadata['last_name']?.toString();
            item.card.brand = metadata['brand']?.toString();
            item.card.state = metadata['state']?.toString();
        }
    }
}