import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { StripeInvoiceInterface } from "./stripe-invoice.interface";

/**
 * Service for managing Stripe invoices
 */
export class StripeInvoiceService extends AbstractService {
  /**
   * List all invoices for the current user
   */
  static async listInvoices(params?: {
    status?: string;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<StripeInvoiceInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeInvoice,
    });

    if (params?.status) {
      endpoint.addAdditionalParam("status", params.status);
    }

    return this.callApi({
      type: Modules.StripeInvoice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * List every invoice of a company (platform administrator only), drafts excluded, newest first,
   * each with its recorded price and `forSubscription`
   */
  static async findManyForCompany(params: { companyId: string }): Promise<StripeInvoiceInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Company,
      id: params.companyId,
      childEndpoint: Modules.StripeInvoice,
    });

    return this.callApi({
      type: Modules.StripeInvoice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Get a specific invoice by ID
   */
  static async getInvoice(params: { invoiceId: string }): Promise<StripeInvoiceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeInvoice,
      id: params.invoiceId,
    });

    return this.callApi<StripeInvoiceInterface>({
      type: Modules.StripeInvoice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Get the upcoming invoice for the current user
   */
  static async getUpcomingInvoice(): Promise<StripeInvoiceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeInvoice,
      id: "upcoming",
    });

    return this.callApi<StripeInvoiceInterface>({
      type: Modules.StripeInvoice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
