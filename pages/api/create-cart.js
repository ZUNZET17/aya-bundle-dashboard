 import { shopifyGqlRequest } from "../../lib/shopify";

export default async function handler(req, res) {
  const data = await shopifyGqlRequest({
    query: `
      mutation CreateCart {
        cartCreate {
          cart {
            checkoutUrl
            id
          }
        }
      }
    `,
    variables:{}
  });

  if (!data) {
    return res.status(500).json({
      statusCode: 500,
      body: JSON.stringify({ message: 'there was a problem creating a cart.' })
    })
  }
  return res.status(200).json({
    statusCode: 200,
    body: JSON.stringify({
      cartId: data.cartCreate?.cart?.id,
      checkoutUrl: data.cartCreate?.cart?.checkoutUrl
    })
  });
  
}