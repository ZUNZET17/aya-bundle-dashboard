import { stringify } from "postcss"

const url = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESSTOKEN

const gql = String.raw

export async function shopifyGqlRequest(query, variables = {}) {

  const options = {
    endpoint: url,
    method: "POST",
    headers: {
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  }

  try {
    const response = await fetch(url, options).then(response => {
      return response.json()
    })

    return response.data

  } catch (error) {
    throw new Error("Data not fetched")
  }
}

export async function createCart() {
  const query = gql`
    mutation cartCreate {
    cartCreate {
      cart {
        checkoutUrl
        id
      }
      userErrors {
        field
        message
      }
    }
  }
  `
  const response = await shopifyGqlRequest(query);
  
  if (!response) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: 'Couldn\'t create cart'})
    }
  }

  return response
}

export async function loadCart(cartId) {
  const query = gql`
    query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      estimatedCost {
        totalAmount {
          amount
        }
      }
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            estimatedCost {
              subtotalAmount {
                amount
                currencyCode
              }
              totalAmount {
                amount
                currencyCode
              }
            }
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                  onlineStoreUrl
                  images(first: 1) {
                    edges {
                      node {
                        transformedSrc
                        altText
                      }
                    }
                  }
                }
                priceV2 {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
  `
  const response = await shopifyGqlRequest(query, {cartId});

  if (!response) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: 'Couldn\'t create cart'})
    }
  }
  return response.cart
}

export async function addToCart(cartId, lines) {
  const query = gql`
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  product {
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  `
  if (lines[0].quantity <= 0){
    alert('toasted!')
    return
  }

  const response = await shopifyGqlRequest(query, {cartId, lines});

  if (!response) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: 'Couldn\'t create cart'})
    }
  }

  return response
}

export async function removeItems(cartId, lineIds) {
  const query = gql`
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
  `

  const response = await shopifyGqlRequest(query, {cartId, lineIds});

  if (!response) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: 'Couldn\'t remove item'})
    }
  }

  return response
}



