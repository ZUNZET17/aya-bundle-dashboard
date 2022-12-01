import { shopifyAdminGqlRequest, loadProducts } from "../../lib/shopify";
import { fetchDiscounts } from "../../lib/utils"
import axios from "axios";
import NextCors from 'nextjs-cors';

const stores = {
  'www.ecoaya.com': {
    'endpoint': 'aya-us-discounts',
    'store_name': 'Ecoaya-US',
    'store_url': 'www.ecoaya.com',
    'storefront_env': process.env.NEXT_PUBLIC_STOREFRONT_API_URL_AYA_US,
    'admin_env': process.env.NEXT_PUBLIC_ADMIN_API_URL_AYA_US,
    'storefront_token_env': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESSTOKEN_AYA_US,
    'admin_token_env': process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_ACCESSTOKEN_AYA_US
  },
  'www.ecoaya.eu': {
    'endpoint': 'aya-eu-discounts',
    'store_name': 'Ecoaya-EU',
    'store_url': 'www.ecoaya.eu',
    'storefront_env': process.env.NEXT_PUBLIC_STOREFRONT_API_URL_AYA_EU,
    'admin_env': process.env.NEXT_PUBLIC_ADMIN_API_URL_AYA_EU,
    'storefront_token_env': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESSTOKEN_AYA_EU,
    'admin_token_env': process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_ACCESSTOKEN_AYA_EU
  },
  'armsofandes.com': {
    'endpoint': 'aoa-us-discounts',
    'store_name': 'AOA-US',
    'store_url': 'armsofandes.com',
    'storefront_env': process.env.NEXT_PUBLIC_STOREFRONT_API_URL_AOA_US,
    'admin_env': process.env.NEXT_PUBLIC_ADMIN_API_URL_AOA_US,
    'storefront_token_env': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESSTOKEN_AOA_US,
    'admin_token_env': process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_ACCESSTOKEN_AOA_US
  },
  'armsofandes.eu': {
    'endpoint': 'aoa-eu-discounts',
    'store_name': 'AOA-EU',
    'store_url': 'armsofandes.eu',
    'storefront_env': process.env.NEXT_PUBLIC_STOREFRONT_API_URL_AOA_EU,
    'admin_env': process.env.NEXT_PUBLIC_ADMIN_API_URL_AOA_EU,
    'storefront_token_env': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESSTOKEN_AOA_EU,
    'admin_token_env': process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_ACCESSTOKEN_AOA_EU
  }
}

export default async function handler(req, res) {
  await NextCors(req, res, {
    // Options
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  const requestBody = req.body
  // const requestBody = JSON.parse(requestData)
  const strapi_url = process.env.NEXT_PUBLIC_STRAPI_URL
  const date = new Date(Date.now())
  const store = stores[requestBody.storeName]
  const storeEndPoint = store.endpoint
  const url = `${strapi_url}/api/${storeEndPoint}`

  const data = await shopifyAdminGqlRequest({
    query: `
    mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
      discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
        automaticDiscountNode {
          id
          automaticDiscount {
            ... on DiscountAutomaticBasic {
              startsAt
              endsAt
              minimumRequirement {
                ... on DiscountMinimumSubtotal {
                  greaterThanOrEqualToSubtotal {
                    amount
                    currencyCode
                  }
                }
              }
              combinesWith {
                orderDiscounts
                productDiscounts
                shippingDiscounts
              }
              customerGets {
                value {
                    ... on DiscountPercentage {
                    percentage
                    }
                }
                items {
                  ... on AllDiscountItems {
                    allItems
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          code
          message
        }
      }
    }
    `,
    variables: {
      "automaticBasicDiscount": {
        "title": requestBody.discountTitle,
        "startsAt": date.toISOString(),
        "endsAt": null,
        "minimumRequirement": {
            "quantity": {
            "greaterThanOrEqualToQuantity": requestBody.minimum
            }
        },
        "combinesWith": {
          "orderDiscounts": false,
          "productDiscounts": true,
          "shippingDiscounts": true
        },
        "customerGets": {
          "value": {
            "percentage": (requestBody.amount / 100)
          },
          "items": {
            "all": false,
            "products": {
                "productsToAdd": requestBody.productsToAdd.map(v => v.id)
            }
          }
        }
      }
    },
    storeData: store

  });

  if (!data) {
    return res.status(500).json({
      statusCode: 500,
      body: JSON.stringify({ message: 'there was a problem creating the discount.' })
    })
  }

  if (data.errors) {
    return res.status(500).json({
      statusCode: 500,
      body: JSON.stringify({ message: data.errors })
    })
  }

  return res.status(200).json({
    statusCode: 200,
    body: JSON.stringify({
      message: 'success',
      data: data
    })
  });
  
}