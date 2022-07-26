import { CommandSet } from 'pip-services3-commons-nodex';
import { IPaymentMethodsController } from './IPaymentMethodsController';
export declare class PaymentMethodsCommandSet extends CommandSet {
    private _logic;
    constructor(logic: IPaymentMethodsController);
    private makeGetPaymentMethodsCommand;
    private makeGetPaymentMethodByIdCommand;
    private makeCreatePaymentMethodCommand;
    private makeUpdatePaymentMethodCommand;
    private makeDeletePaymentMethodByIdCommand;
}
