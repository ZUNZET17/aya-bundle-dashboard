import { shopifyAdminGqlRequest } from "../../lib/shopify";
import { fetchDiscounts } from "../../lib/utils"
import axios from "axios";
import NextCors from 'nextjs-cors';

export default async function handler(req, res) {
  await NextCors(req, res, {
    // Options
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });

  const request = JSON.parse(req.body)
  const strapi_url = process.env.NEXT_PUBLIC_STRAPI_URL
  const date = new Date(Date.now())
  const reqBundle = request.bundleTitle
  const reqVariants= request.selectedVariants.map(v => `gid://shopify/ProductVariant/${v}`)
  const reqProducts = request.bundleProducts.map(v => `gid://shopify/Product/${v}`)
  const reqTotalAmount = request.totalAmount
  const url = `${strapi_url}/api/discount-lists`

  const discountRules = await axios.get(url)
    .then(res => res.data.data)
    .catch(err => err)
  const discountRule = discountRules.filter(d => d.attributes.bundle ==  reqBundle)[0]
  const discountProducts = discountRule.attributes.products.selectedProducts.map(p => p.id)

  if (!reqProducts.every(x => discountProducts.includes(x))){
    return res.status(400).json({message: 'Invalid Data'})
  }
  
  const discountAmount = discountRule.attributes.amount
  const percentageAmount =  ( (reqTotalAmount / 100) * discountAmount ).toString()
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
                "productVariantsToAdd": reqVariants
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
    }

  });

  if (!data) {
    return res.status(500).json({
      statusCode: 500,
      body: JSON.stringify({ message: 'there was a problem creating the discount.' })
    })
  }

  if (data.data.userErrors) {
    return res.status(500).json({
      statusCode: 500,
      body: JSON.stringify({ message: data.data.userErrors })
    })
  }

  return res.status(200).json({
    statusCode: 200,
    body: JSON.stringify({
      data: data.data.discountCodeBasicCreate.codeDiscountNode.codeDiscount.codes.nodes[0].code
    })
  });
  
}