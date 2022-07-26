import { CommandSet } from 'pip-services3-commons-nodex';
import { ICommand } from 'pip-services3-commons-nodex';
import { Command } from 'pip-services3-commons-nodex';
import { Parameters } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { ObjectSchema } from 'pip-services3-commons-nodex';
import { TypeCode } from 'pip-services3-commons-nodex';
import { FilterParamsSchema } from 'pip-services3-commons-nodex';
import { PagingParamsSchema } from 'pip-services3-commons-nodex';

import { PaymentMethodV1Schema } from '../data/version1/PaymentMethodV1Schema';
import { IPaymentMethodsController } from './IPaymentMethodsController';

export class PaymentMethodsCommandSet extends CommandSet {
    private _logic: IPaymentMethodsController;

    constructor(logic: IPaymentMethodsController) {
        super();

        this._logic = logic;

        // Register commands to the database
		this.addCommand(this.makeGetPaymentMethodsCommand());
		this.addCommand(this.makeGetPaymentMethodByIdCommand());
		this.addCommand(this.makeCreatePaymentMethodCommand());
		this.addCommand(this.makeUpdatePaymentMethodCommand());
		this.addCommand(this.makeDeletePaymentMethodByIdCommand());
    }

	private makeGetPaymentMethodsCommand(): ICommand {
		return new Command(
			"get_payment_methods",
			new ObjectSchema(true)
				.withOptionalProperty('filter', new FilterParamsSchema())
				.withOptionalProperty('paging', new PagingParamsSchema()),
            async (correlationId: string, args: Parameters) => {
                let filter = FilterParams.fromValue(args.get("filter"));
                let paging = PagingParams.fromValue(args.get("paging"));
                return await this._logic.getPaymentMethods(correlationId, filter, paging);
            }
		);
	}

	private makeGetPaymentMethodByIdCommand(): ICommand {
		return new Command(
			"get_payment_method_by_id",
			new ObjectSchema(true)
				.withRequiredProperty('method_id', TypeCode.String)
				.withRequiredProperty('customer_id', TypeCode.String),
            async (correlationId: string, args: Parameters) => {
                let methodId = args.getAsString("method_id");
                let customerId = args.getAsString("customer_id");
				return await this._logic.getPaymentMethodById(correlationId, methodId, customerId);
            }
		);
	}

	private makeCreatePaymentMethodCommand(): ICommand {
		return new Command(
			"create_payment_method",
			new ObjectSchema(true)
				.withRequiredProperty('method', new PaymentMethodV1Schema()),
            async (correlationId: string, args: Parameters) => {
                let method = args.get("method");
				return await  this._logic.createPaymentMethod(correlationId, method);
            }
		);
	}

	private makeUpdatePaymentMethodCommand(): ICommand {
		return new Command(
			"update_payment_method",
			new ObjectSchema(true)
				.withRequiredProperty('method', new PaymentMethodV1Schema()),
            async (correlationId: string, args: Parameters) => {
                let method = args.get("method");
                return await this._logic.updatePaymentMethod(correlationId, method);
            }
		);
	}
	
	private makeDeletePaymentMethodByIdCommand(): ICommand {
		return new Command(
			"delete_payment_method_by_id",
			new ObjectSchema(true)
				.withRequiredProperty('method_id', TypeCode.String)
				.withRequiredProperty('customer_id', TypeCode.String),
            async (correlationId: string, args: Parameters) => {
                let methodId = args.getAsNullableString("method_id");
                let customerId = args.getAsString("customer_id");
				return await this._logic.deletePaymentMethodById(correlationId, methodId, customerId);
			}
		);
	}

}