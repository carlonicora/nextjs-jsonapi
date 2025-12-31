import { AbstractApiData, JsonApiHydratedDataInterface, Modules, StripeSubscriptionInterface } from "../../../../core";
import { InvoiceStatus, StripeInvoiceInterface } from "./stripe-invoice.interface";

export class StripeInvoice extends AbstractApiData implements StripeInvoiceInterface {
  private _stripeInvoiceId?: string;
  private _stripeInvoiceNumber?: string;
  private _customerId?: string;
  private _subscriptionId?: string;
  private _subscription?: StripeSubscriptionInterface;
  private _status?: InvoiceStatus;
  private _amountDue?: number;
  private _amountPaid?: number;
  private _amountRemaining?: number;
  private _subtotal?: number;
  private _total?: number;
  private _tax?: number;
  private _currency?: string;
  private _periodStart?: Date;
  private _periodEnd?: Date;
  private _dueDate?: Date;
  private _paidAt?: Date;
  private _attemptCount: number = 0;
  private _attempted: boolean = false;
  private _stripeHostedInvoiceUrl?: string;
  private _stripePdfUrl?: string;
  private _paid: boolean = false;
  private _metadata?: Record<string, any>;

  get stripeInvoiceId(): string {
    if (!this._stripeInvoiceId) throw new Error("stripeInvoiceId is not defined");
    return this._stripeInvoiceId;
  }

  get stripeInvoiceNumber(): string | undefined {
    return this._stripeInvoiceNumber;
  }

  get customerId(): string | undefined {
    return this._customerId;
  }

  get subscriptionId(): string | undefined {
    return this._subscriptionId;
  }

  get subscription(): StripeSubscriptionInterface | undefined {
    return this._subscription;
  }

  get status(): InvoiceStatus {
    if (!this._status) throw new Error("status is not defined");
    return this._status;
  }

  get amountDue(): number {
    if (this._amountDue === undefined) throw new Error("amountDue is not defined");
    return this._amountDue;
  }

  get amountPaid(): number {
    if (this._amountPaid === undefined) throw new Error("amountPaid is not defined");
    return this._amountPaid;
  }

  get amountRemaining(): number {
    if (this._amountRemaining === undefined) throw new Error("amountRemaining is not defined");
    return this._amountRemaining;
  }

  get subtotal(): number {
    if (this._subtotal === undefined) throw new Error("subtotal is not defined");
    return this._subtotal;
  }

  get total(): number {
    if (this._total === undefined) throw new Error("total is not defined");
    return this._total;
  }

  get tax(): number | undefined {
    return this._tax;
  }

  get currency(): string {
    if (!this._currency) throw new Error("currency is not defined");
    return this._currency;
  }

  get periodStart(): Date {
    if (!this._periodStart) throw new Error("periodStart is not defined");
    return this._periodStart;
  }

  get periodEnd(): Date {
    if (!this._periodEnd) throw new Error("periodEnd is not defined");
    return this._periodEnd;
  }

  get dueDate(): Date | undefined {
    return this._dueDate;
  }

  get paidAt(): Date | undefined {
    return this._paidAt;
  }

  get attemptCount(): number {
    return this._attemptCount;
  }

  get attempted(): boolean {
    return this._attempted;
  }

  get stripeHostedInvoiceUrl(): string | undefined {
    return this._stripeHostedInvoiceUrl;
  }

  get stripePdfUrl(): string | undefined {
    return this._stripePdfUrl;
  }

  get paid(): boolean {
    return this._paid;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._stripeInvoiceId = data.jsonApi.attributes.stripeInvoiceId;
    this._stripeInvoiceNumber = data.jsonApi.attributes.stripeInvoiceNumber;
    this._customerId = data.jsonApi.attributes.customerId;
    this._subscriptionId = data.jsonApi.attributes.subscriptionId;
    this._status = data.jsonApi.attributes.status;
    this._amountDue = data.jsonApi.attributes.amountDue;
    this._amountPaid = data.jsonApi.attributes.amountPaid;
    this._amountRemaining = data.jsonApi.attributes.amountRemaining;
    this._subtotal = data.jsonApi.attributes.subtotal;
    this._total = data.jsonApi.attributes.total;
    this._tax = data.jsonApi.attributes.tax;
    this._currency = data.jsonApi.attributes.currency;

    this._periodStart = data.jsonApi.attributes.periodStart ? new Date(data.jsonApi.attributes.periodStart) : undefined;
    this._periodEnd = data.jsonApi.attributes.periodEnd ? new Date(data.jsonApi.attributes.periodEnd) : undefined;
    this._dueDate = data.jsonApi.attributes.dueDate ? new Date(data.jsonApi.attributes.dueDate) : undefined;
    this._paidAt = data.jsonApi.attributes.paidAt ? new Date(data.jsonApi.attributes.paidAt) : undefined;

    this._attemptCount = data.jsonApi.attributes.attemptCount ?? 0;
    this._attempted = data.jsonApi.attributes.attempted ?? false;
    this._stripeHostedInvoiceUrl = data.jsonApi.attributes.stripeHostedInvoiceUrl;
    this._stripePdfUrl = data.jsonApi.attributes.stripePdfUrl;
    this._paid = data.jsonApi.attributes.paid ?? false;

    this._metadata = data.jsonApi.attributes.metadata
      ? typeof data.jsonApi.attributes.metadata === "string"
        ? JSON.parse(data.jsonApi.attributes.metadata)
        : data.jsonApi.attributes.metadata
      : undefined;

    // Hydrate subscription relationship
    this._subscription = this._readIncluded(
      data,
      "subscription",
      Modules.StripeSubscription,
    ) as StripeSubscriptionInterface;

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("Invoice is managed by Stripe and cannot be created directly");
  }
}
