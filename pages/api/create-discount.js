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
  'www.armsofandes.com': {
    'endpoint': 'aoa-us-discounts',
    'store_name': 'AOA-US',
    'store_url': 'www.armsofandes.com',
    'storefront_env': process.env.NEXT_PUBLIC_STOREFRONT_API_URL_AOA_US,
    'admin_env': process.env.NEXT_PUBLIC_ADMIN_API_URL_AOA_US,
    'storefront_token_env': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESSTOKEN_AOA_US,
    'admin_token_env': process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_ACCESSTOKEN_AOA_US
  },
  'www.armsofandes.eu': {
    'endpoint': 'aoa-eu-discounts',
    'store_name': 'AOA-EU',
    'store_url': 'www.armsofandes.eu',
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
  const reqBundle = requestBody.bundleTitle
  const reqVariants= requestBody.selectedVariants.map(v => ({gid: `gid:\/\/shopify\/ProductVariant\/${v.id}`, qty: v.qty}))
  const variantsTotal = await loadProducts(reqVariants.map(v => `"${v.gid}"`), store)
  let totalBundlePrice = 0
  for (let x in variantsTotal.data) {
    let currVariant = reqVariants.find(v => v.gid == variantsTotal.data[x].id)
    totalBundlePrice += ( Number(variantsTotal.data[x].price) * currVariant.qty )
  }
  const reqProducts = requestBody.bundleProducts.map(v => `gid:\/\/shopify\/Product\/${v}`)
  const reqTotalAmount = totalBundlePrice
  const url = `${strapi_url}/api/${storeEndPoint}`
  const discountRules = await axios.get(url)
    .then(res => res.data.data)
    .catch(err => err)

  const discountRule = discountRules.filter(d => d.attributes.bundle ==  reqBundle)[0]
  const discountProducts = discountRule.attributes.products.selectedProducts.map(p => p.id)
  if (!reqProducts.every(x => discountProducts.includes(x))){
    return res.status(400).json({message: 'Invalid Data'})
  }
  
  const discountAmount = discountRule.attributes.amount
  const percentageAmount =  ( (reqTotalAmount / 100) * discountAmount ).toFixed(2)
  const discountTitle = discountRule.attributes.title
  const discountCode = discountRule.attributes.code + '-' + (Date.now() / Math.random()).toString().slice(0, 6)
  const discountMinimumQty = (discountRule.attributes.minimum).toString()

  const data = await shopifyAdminGqlRequest({
    query: `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first:10) {
                nodes {
                  code
                }
              }
              startsAt
              endsAt
              customerSelection {
                ... on DiscountCustomerAll {
                  allCustomers
                }
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
              appliesOncePerCustomer
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
      "basicCodeDiscount": {
        "title": discountTitle,
        "code": discountCode,
        "startsAt": date.toISOString(),
        "endsAt": (new Date(Date.now() + (3600 * 1000 * 24))).toISOString(),
        "customerSelection": {
          "all": true
        },
        "customerGets": {
          "value": {
            "discountAmount": {
                "amount": percentageAmount,
                "appliesOnEachItem": false
            }
          },
          "items": {
            "all": false,
            "products": {
                "productVariantsToAdd": reqVariants.map(v => v.gid)
            }
          }
        },
        "minimumRequirement": {
          "quantity": {
            "greaterThanOrEqualToQuantity": discountMinimumQty
          }
        },
        "appliesOncePerCustomer": false,
        "usageLimit": 100
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
      data: data.data.discountCodeBasicCreate.codeDiscountNode.codeDiscount.codes.nodes[0].code
    })
  });
  
}