import Stripe from 'stripe';
import { builder } from '../builder'
import { stripe } from '../utils'
import { StripeInvoice } from '../types';

builder.objectType('StripePaymentIntent', {
  description: 'Payment intents',
  fields: (t) => ({
    id: t.exposeString('id'),
    object: t.exposeString('object'),
    amount: t.exposeInt('amount'),
    currency: t.exposeString('currency'),
    description: t.exposeString('description',{
        nullable: true
    }),
    metadata: t.expose('metadata', {
        type: 'JSON',
        nullable: true
    }),
    paymentMethodTypes: t.exposeStringList('paymentMethodTypes'),
    statementDescriptor: t.exposeString('statementDescriptor', {
        nullable: true
    }),
    statementDescriptorSuffix: t.exposeString('statementDescriptorSuffix',{
        nullable: true
    }),
    receiptEmail: t.exposeString('receiptEmail', {
        nullable: true
    }),
    customer: t.exposeString('customer'),
    amountCapturable: t.exposeInt('amountCapturable'),
    amountDetails: t.expose('amountDetails', {
        nullable: true,
        type: 'JSON'
    }),
    amountReceived: t.exposeInt('amountReceived'),

    applicationFeeAmount: t.exposeInt('applicationFeeAmount', {
        nullable:true
    }),
    canceledAt: t.exposeInt('canceledAt', {
        nullable: true
    }),
    transferGroup: t.exposeString('transferGroup',{ 
      nullable:true
    }),
    cancellationReason: t.exposeString('cancellationReason', {
        nullable:true
    }),
    created: t.exposeInt('created', {
        nullable: true, 
    }),
    status: t.exposeString('status'),
    invoice: t.field({
      type: 'StripeInvoice',
      nullable: true,
      resolve: async (paymentIntent) => {
        const {invoice} = paymentIntent

        if(!invoice) {
            return null
        }

        const invoiceData  = await stripe.invoices.retrieve(invoice as string) 

        return invoiceData as Stripe.Response<StripeInvoice>
      }
    }),
    // todo: missing fields
    // capture_method
    // add charges
    // application
  })
})
