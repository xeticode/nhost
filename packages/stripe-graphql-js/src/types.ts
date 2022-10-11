import type Stripe from 'stripe'

import type { CORSOptions, YogaInitialContext } from '@graphql-yoga/node'

export type StripeGraphQLContext = {
  isAllowed: (stripeCustomerId: string, context: Context) => boolean | Promise<boolean>
  userClaims?: UserHasuraClaims
  isAdmin: boolean
}

export type Context = YogaInitialContext & StripeGraphQLContext

export type CreateServerProps = {
  cors?: CORSOptions
  isAllowed?: (stripeCustomerId: string, context: Context) => boolean | Promise<boolean>
  graphiql?: boolean
}

// removing Stripe.Customer from `customer` because we will never expand
// and fetch the full customer object
export type StripePaymentMethod = Stripe.PaymentMethod & {
  customer: string | null
}

export type StripeSubscription = Stripe.Subscription & {
  customer: string
  test_clock: string | null
}

export type StripeInvoice = Stripe.Invoice & {
  id: string
  customer: string
  default_payment_method: StripePaymentMethod | null
  payment_intent: any
}

export type StripePaymentIntent = Stripe.PaymentIntent & {
  customer: string
}

export type UserHasuraClaims = {
  'x-hasura-user-id': string
  'x-hasura-default-role': string
  'x-hasura-allowed-roles': string[]
} & {
  [key: string]: string // had to add this here to avoide adding `| string[]` at the end here.
}
