let PaymentMethodsProcess = require('../obj/src/container/PaymentMethodsProcess').PaymentMethodsProcess;

try {
    new PaymentMethodsProcess().run(process.argv);
} catch (ex) {
    console.error(ex);
}
