const assert = require('chai').assert;

import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../../src/data/version1/PaymentMethodV1';
import { PaymentMethodTypeV1 } from '../../src/data/version1/PaymentMethodTypeV1';

import { IPaymentMethodsPersistence } from '../../src/persistence/IPaymentMethodsPersistence';
import { TestModel } from '../data/TestModel';



export class PaymentMethodsPersistenceFixture {
    private _persistence: IPaymentMethodsPersistence;

    private PAYMENT_METHOD1: PaymentMethodV1;
    private PAYMENT_METHOD2: PaymentMethodV1;
    private PAYMENT_METHOD3: PaymentMethodV1;

    private PAYMENT_METHODS: PaymentMethodV1[] = [
        TestModel.createPaymentMethod1(),
        TestModel.createPaymentMethod2(),
        TestModel.createPaymentMethod3()
    ];

    constructor(persistence, paymentMethods?: PaymentMethodV1[]) {
        assert.isNotNull(persistence);
        this._persistence = persistence;

        paymentMethods = paymentMethods ?? this.PAYMENT_METHODS;

        if (paymentMethods) {
            if (paymentMethods.length > 0) this.PAYMENT_METHOD1 = paymentMethods[0];
            if (paymentMethods.length > 1) this.PAYMENT_METHOD2 = paymentMethods[1];
            if (paymentMethods.length > 2) this.PAYMENT_METHOD3 = paymentMethods[2];

            this.PAYMENT_METHODS = paymentMethods;
        }
    }

    private async testCreatePaymentMethods() {
        // Create one payment method
        let paymentMethod = await this._persistence.create(null, this.PAYMENT_METHOD1);

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, this.PAYMENT_METHOD1);

        this.PAYMENT_METHOD1.id = paymentMethod.id;

        // Create another payment method
        paymentMethod = await this._persistence.create(null, this.PAYMENT_METHOD2);

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, this.PAYMENT_METHOD2);

        this.PAYMENT_METHOD2.id = paymentMethod.id;
        
        // Create yet another payment method
        paymentMethod = await this._persistence.create(null, this.PAYMENT_METHOD3);

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, this.PAYMENT_METHOD3);

        this.PAYMENT_METHOD3.id = paymentMethod.id;
    }

    public async testCrudOperations() {
        let paymentMethod1: PaymentMethodV1;

        // Create items
        await this.testCreatePaymentMethods();

        // Get all payment methods
        let page = await this._persistence.getPageByFilter(
            null,
            FilterParams.fromValue({
                payout: false
            }),
            new PagingParams()
        );

        assert.isObject(page);
        assert.lengthOf(page.data, 3);

        paymentMethod1 = page.data[0];

        // Update the payment method
        paymentMethod1.name = 'Updated Card 1';
        
        let paymentMethod = await this._persistence.update(null, paymentMethod1);

        assert.isObject(paymentMethod);
        assert.equal(paymentMethod.name, 'Updated Card 1');

        paymentMethod1 = paymentMethod;

        // Delete payment method
        await this._persistence.delete(null, paymentMethod1.id, paymentMethod1.customer_id);

        // Try to get deleted payment method
        paymentMethod = await this._persistence.getById(null, paymentMethod1.id, paymentMethod1.customer_id);

        assert.isNull(paymentMethod || null);
    }

    public async testGetWithFilter() {
        // Create payment methods
        await this.testCreatePaymentMethods();

        // Get payment methods filtered by customer id
        let page = await this._persistence.getPageByFilter(
            null,
            FilterParams.fromValue({
                customer_id: '1',
                payout: false
            }),
            new PagingParams()
        );

        assert.isObject(page);
        assert.lengthOf(page.data, 2);

        // Get payment methods by type
        page = await this._persistence.getPageByFilter(
            null,
            FilterParams.fromValue({
                type: PaymentMethodTypeV1.Card,
                payout: false
            }),
            new PagingParams()
        );

        assert.isObject(page);

        let cardsCount = this.PAYMENT_METHODS.filter(x => x.type == PaymentMethodTypeV1.Card).length;
        assert.lengthOf(page.data, cardsCount);

        // Get payment methods by ids
        page = await this._persistence.getPageByFilter(
            null,
            FilterParams.fromValue({
                ids: [this.PAYMENT_METHODS[0].id, this.PAYMENT_METHODS[2].id],
                payout: false
            }),
            new PagingParams()
        );

        assert.isObject(page);
        assert.lengthOf(page.data, 2);
    }

    public async testExternalBankAccount() {
        let bankAccount = TestModel.createPayoutBankAccount();

        // Create external bank account
        let paymentMethod = await this._persistence.create(null, bankAccount);

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, bankAccount);

        // Get payment methods by type
        let page = await this._persistence.getPageByFilter(
            null,
            FilterParams.fromValue({
                type: PaymentMethodTypeV1.BankAccount,
                payout: true
            }),
            new PagingParams()
        );

        assert.isObject(page);

        let cardsCount = this.PAYMENT_METHODS.filter(x => x.type == PaymentMethodTypeV1.Card).length;
        assert.lengthOf(page.data, cardsCount);
    }
}
