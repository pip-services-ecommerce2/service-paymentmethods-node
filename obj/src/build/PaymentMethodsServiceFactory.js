"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodsServiceFactory = void 0;
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const PaymentMethodsMongoDbPersistence_1 = require("../persistence/PaymentMethodsMongoDbPersistence");
const PaymentMethodsFilePersistence_1 = require("../persistence/PaymentMethodsFilePersistence");
const PaymentMethodsMemoryPersistence_1 = require("../persistence/PaymentMethodsMemoryPersistence");
const PaymentMethodsStripePersistence_1 = require("../persistence/PaymentMethodsStripePersistence");
const PaymentMethodsPayPalPersistence_1 = require("../persistence/PaymentMethodsPayPalPersistence");
const PaymentMethodsController_1 = require("../logic/PaymentMethodsController");
const PaymentMethodsHttpServiceV1_1 = require("../services/version1/PaymentMethodsHttpServiceV1");
const persistence_1 = require("../persistence");
class PaymentMethodsServiceFactory extends pip_services3_components_nodex_1.Factory {
    constructor() {
        super();
        this.registerAsType(PaymentMethodsServiceFactory.MemoryPersistenceDescriptor, PaymentMethodsMemoryPersistence_1.PaymentMethodsMemoryPersistence);
        this.registerAsType(PaymentMethodsServiceFactory.FilePersistenceDescriptor, PaymentMethodsFilePersistence_1.PaymentMethodsFilePersistence);
        this.registerAsType(PaymentMethodsServiceFactory.MongoDbPersistenceDescriptor, PaymentMethodsMongoDbPersistence_1.PaymentMethodsMongoDbPersistence);
        this.registerAsType(PaymentMethodsServiceFactory.PayPalPersistenceDescriptor, PaymentMethodsPayPalPersistence_1.PaymentMethodsPayPalPersistence);
        this.registerAsType(PaymentMethodsServiceFactory.PayPalMongoDbPersistenceDescriptor, persistence_1.PaymentMethodsPayPalMongoDbPersistence);
        this.registerAsType(PaymentMethodsServiceFactory.StripePersistenceDescriptor, PaymentMethodsStripePersistence_1.PaymentMethodsStripePersistence);
        this.registerAsType(PaymentMethodsServiceFactory.ControllerDescriptor, PaymentMethodsController_1.PaymentMethodsController);
        this.registerAsType(PaymentMethodsServiceFactory.HttpServiceDescriptor, PaymentMethodsHttpServiceV1_1.PaymentMethodsHttpServiceV1);
    }
}
exports.PaymentMethodsServiceFactory = PaymentMethodsServiceFactory;
PaymentMethodsServiceFactory.Descriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "factory", "default", "default", "1.0");
PaymentMethodsServiceFactory.MemoryPersistenceDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "persistence", "memory", "*", "1.0");
PaymentMethodsServiceFactory.FilePersistenceDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "persistence", "file", "*", "1.0");
PaymentMethodsServiceFactory.MongoDbPersistenceDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "persistence", "mongodb", "*", "1.0");
PaymentMethodsServiceFactory.PayPalPersistenceDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "persistence", "paypal", "*", "1.0");
PaymentMethodsServiceFactory.PayPalMongoDbPersistenceDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "persistence", "paypal-mongodb", "*", "1.0");
PaymentMethodsServiceFactory.StripePersistenceDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "persistence", "stripe", "*", "1.0");
PaymentMethodsServiceFactory.ControllerDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "controller", "default", "*", "1.0");
PaymentMethodsServiceFactory.HttpServiceDescriptor = new pip_services3_commons_nodex_1.Descriptor("service-paymentmethods", "service", "http", "*", "1.0");
//# sourceMappingURL=PaymentMethodsServiceFactory.js.map