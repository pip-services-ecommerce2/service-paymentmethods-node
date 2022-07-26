import { FilterParams, UnsupportedException } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ICleanable } from 'pip-services3-commons-nodex';
import { CredentialParams } from 'pip-services3-components-nodex';
import { CredentialResolver } from 'pip-services3-components-nodex';
import { CompositeLogger } from 'pip-services3-components-nodex';

import { BadRequestException } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { PaymentMethodTypeV1 } from '../data/version1/PaymentMethodTypeV1';
import { IPaymentMethodsPersistence } from './IPaymentMethodsPersistence'
import { CreditCardV1, AddressV1 } from '../data/version1';
import { resolve } from 'path';
import { rejects } from 'assert';

export class PaymentMethodsPayPalPersistence implements IPaymentMethodsPersistence, IConfigurable,
    IReferenceable, IOpenable, ICleanable {

    private _sandbox: boolean = false;
    private _credentialsResolver: CredentialResolver = new CredentialResolver();
    private _logger: CompositeLogger = new CompositeLogger();
    private _client: any = null;

    public constructor() { }

    public configure(config: ConfigParams): void {
        this._logger.configure(config);
        this._credentialsResolver.configure(config);

        this._sandbox = config.getAsBooleanWithDefault("options.sandbox", this._sandbox);
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._credentialsResolver.setReferences(references);
    }

    public isOpen(): boolean {
        return this._client != null;
    }

    public async open(correlationId: string): Promise<void> {
        let credentials: CredentialParams;

        // Get credential params
        credentials = await this._credentialsResolver.lookup(correlationId);

        // Connect
        this._client = require('paypal-rest-sdk');
        this._client.configure({
            mode: this._sandbox ? 'sandbox' : 'live',
            client_id: credentials.getAccessId(),
            client_secret: credentials.getAccessKey()
        });
    }

    public async close(correlationId: string): Promise<void> {
        this._client = null;
    }

    private toPublic(value: any): PaymentMethodV1 {
        if (value == null) return null;

        // let result = _.omit(value, 'external_customer_id', 'external_method_id',
        //     'external_method_id', 'valid_until', 'create_time', 'update_time', 'links');
        let result = new PaymentMethodV1();
        result.id = value.id;
        result.type = PaymentMethodTypeV1.Card;
        result.payout = false;
        result.card = new CreditCardV1();
        result.card.brand = value.type;
        result.card.expire_month = parseInt(value.expire_month);
        result.card.expire_year = parseInt(value.expire_year);
        result.card.first_name = value.first_name;
        result.card.last_name = value.last_name;
        result.card.state = value.state;

        if (value.billing_address) {
            result.billing_address = new AddressV1();
            result.billing_address.line1 = value.billing_address.line1;
            result.billing_address.line2 = value.billing_address.line2;
            result.billing_address.city = value.billing_address.city;
            result.billing_address.state = value.billing_address.state;
            result.billing_address.country_code = value.billing_address.country_code;
            result.billing_address.postal_code = value.billing_address.postal_code;
        }

        // Parse external_card_id
        let temp = value.external_card_id.split(';');
        result.card.number = temp.length > 0 ? temp[0] : '';
        result.name = temp.length > 1 ? temp[1] : '';
        result.card.ccv = temp.length > 2 ? temp[2] : '';
        result.saved = temp.length > 3 ? temp[3] == 'saved' : false;
        result.default = temp.length > 4 ? temp[4] == 'default' : false;
        result.customer_id = temp.length > 5 ? temp[5] : value.external_customer_id;
        return result;
    }

    private fromPublic(value: PaymentMethodV1): any {
        if (value == null) return null;

        // delete value.create_time;
        // delete value.update_time;

        // let result = _.omit(value, 'id', 'state', 'customer_id', 'ccv', 'name', 'saved', 'default');
        let card: CreditCardV1 = value.card;

        let result = {
            number: card.number,
            type: card.brand,
            expire_month: card.expire_month?.toString(),
            expire_year: card.expire_year?.toString(),
            first_name: card.first_name,
            last_name: card.last_name,
            billing_address: null,
            external_customer_id: value.customer_id,
            external_card_id: null
        };

        if (value.billing_address) {
            result.billing_address = {
                line1: value.billing_address?.line1,
                line2: value.billing_address?.line2,
                city: value.billing_address?.city,
                state: value.billing_address?.state,
                country_code: value.billing_address?.country_code,
                postal_code: value.billing_address?.postal_code,
            };
        }

        result.external_customer_id = value.customer_id;

        // Generate external_card_id
        let temp = value.card.number;
        temp += ';' + (value.name ? value.name.replace(';', '_') : '');
        temp += ';' + (value.card.ccv ? value.card.ccv.replace(';', '') : '');
        temp += ';' + (value.saved ? 'saved' : '');
        temp += ';' + (value.default ? 'default' : '');
        temp += ';' + (value.customer_id ? value.customer_id.replace(';', '') : '');
        result.external_card_id = temp;

        return result;
    }

    public async getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>> {
        let id = filter.getAsNullableString('id');
        let state = filter.getAsNullableString('state');
        let customerId = filter.getAsNullableString('customer_id');
        let saved = filter.getAsNullableBoolean('saved');
        let ids = filter.getAsObject('ids');
        let _default = filter.getAsNullableBoolean('default');
        let payout = filter.getAsNullableBoolean('payout');

        // Process ids filter
        if (typeof ids === 'string')
            ids = ids.split(',');
        if (!Array.isArray(ids))
            ids = null;

        let skip = paging.getSkip(0);
        let take = paging.getTake(100);
        let items: PaymentMethodV1[] = [];

        let page = 0;
        let pageSize = 20;
        let pageItems: PaymentMethodV1[];

        do {
            page++;

            // Set filters supported by PayPal
            let options: any = {
                page: page,
                page_size: pageSize
            };
            if (customerId)
                options.external_customer_id = customerId;

            let data: any = await new Promise((resolve, rejects) => {
                this._client.creditCard.list(options, (err, data) => {
                    if (err) rejects(err);
                    resolve(data);
                });
            });

            pageItems = data.items.map((item) => this.toPublic(item));

            for (let item of pageItems) {
                // Filter items
                if (id != null && item.id != id)
                    continue;
                if (saved != null && item.saved != saved)
                    continue;
                if (state != null && item.card.state != state)
                    continue;
                if (ids != null && ids.indexOf(item.id) < 0)
                    continue;
                if (_default != null && item.default != null && item.default != _default)
                    continue;
                if (payout != null && item.payout != payout)
                    continue;

                // Process skip and take
                if (skip > 0) {
                    skip--;
                    continue;
                }

                if (items.length < take)
                    items.push(item);
            }
        } while (pageItems.length == pageSize && items.length < take)

        return new DataPage(items);
    }

    public async getById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        let data = await new Promise((resolve, rejects) => {
            this._client.creditCard.get(id, (err, data) => {
                if (err != null && err.httpStatusCode == 404)
                    err = null;
                if (err != null) rejects(err);
                resolve(data);
            });
        });

        let item = this.toPublic(data);

        return item;
    }   

    public async create(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        if (item.type != PaymentMethodTypeV1.Card) {
            throw new BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_TYPE', 'Payment method type not supported')
                .withDetails('item', item);
        }

        if (item.payout) {
            throw new BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_PAYOUT', 'Payment method payout not supported')
                .withDetails('item', item);
        }

        item = this.omit(item, ['id']);
        item = this.fromPublic(item);

        let data = await new Promise((resolve, rejects) => {
            this._client.creditCard.create(item, (err, data) => {
                if (err != null) {
                    var strErr = JSON.stringify(err);
                    this._logger.trace(correlationId, "Error creating credit method with PayPal persistence: ", strErr);

                    let code = err && err.response ? err.response.name : "UNKNOWN";
                    let message = err && err.response ? err.response.message : strErr;
                    let status = err && err.httpStatusCode ? err.httpStatusCode : "500";

                    err = new BadRequestException(
                        null, code,
                        message
                    ).withStatus(status);

                    rejects(err);
                }

                resolve(data);
            });
        });

        item = this.toPublic(data);

        return item;
    }

    public async update(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {

        if (item.type != PaymentMethodTypeV1.Card) {
            throw new BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_TYPE', 'Payment method type not supported')
                .withDetails('item', item);
        }

        if (item.payout) {
            throw new BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_PAYOUT', 'Payment method payout not supported')
                .withDetails('item', item);
        }

        let id = item.id;
        let data: any = this.fromPublic(item);

        // Delete and then recreate, because some fields are read-only in PayPal
        // this._client.creditCard.del(id, (err) => {
        //     if (err) {
        //         callback(err, null);
        //         return;
        //     }

        //     this._client.creditCard.create(data, (err, data) => {
        //         item = this.toPublic(data);
        //         callback(err, item);
        //     });
        // });

        // First try to create then delete, because if user misstyped credit method will be just deleted
        let result = await new Promise((resolve, rejects) => {
            this._client.creditCard.create(data, (err, data) => {
                if (err) rejects(err);
                resolve(data);
            });
        });

        await new Promise((resolve, rejects) => {
            this._client.creditCard.del(id, (err) => {
                if (err) rejects(err);
                resolve(null)
            });
        });

        item = this.toPublic(result);

        return item;
    }

    public async delete(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        let data = await new Promise((resolve, rejects) => {
            this._client.creditCard.get(id, (err, data) => {
                if (err != null || data == null)
                    rejects(err);
                resolve(data)
            });
        });

        await new Promise((rejects, resolve) => {
            this._client.creditCard.del(id, (err) => {
                if (err) rejects(err);
            });
        });

        let item = this.toPublic(data);

        return item;
    }

    public async clear(correlationId: string): Promise<void> {
        let page = 0;
        let pageSize = 20;
        let creditCards: any[] = []

        do {
            page++;

            let options = {
                page_size: pageSize,
                page: page
            };

            creditCards = await new Promise((resolve, rejects) => {
                this._client.creditCard.list(options, (err, page) => {
                    if (err) rejects(err);
                    resolve(page != null ? page.items : null);
                });
            });

            let tasks = [];

            for (let creditCard of creditCards) {
                tasks.push(
                    new Promise((resolve, rejects) => {
                        this._client.creditCard.del(creditCard.id, (err) => {
                            if (err) rejects(err);
                            resolve(null);
                        });
                    })
                );
            }

            await Promise.all(tasks);
            
        } while (creditCards.length == pageSize)
    }

    private omit(obj: any, props: any[]): any {
        obj = { ...obj }
        props.forEach(prop => delete obj[prop])
        return obj
    }
}