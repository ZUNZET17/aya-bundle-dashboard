import { stringify } from "postcss"
import axios from "axios"

const url = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESSTOKEN
const adminAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_ACCESSTOKEN

const gql = String.raw

export async function shopifyGqlRequest({ query, variables }) {
  const options = {
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

export async function shopifyAdminGqlRequest({ query, variables }) {
  const gql = String.raw

  const options = {
    headers: {
      "X-Shopify-Access-Token": adminAccessToken,
      "Accept": "application/json",
      "Content-Type": "application/json",
    }
  }

  const response = await axios({
    url: adminUrl,
    method: 'post',
    headers: {
      "X-Shopify-Access-Token": adminAccessToken,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    data: {
      query: query,
      variables: variables
    }
  })
  .then(res => res)
  .catch(err => err);

  return response.data

}

export async function loadSearchResults(qry) {
  const regex = /[-]/gm
  const qryParam = qry.trim()
  const query = gql`
    query searchProducts($qryParam: String!) {
    products(first: 15, query: $qryParam) {
      edges {
        node {
          id
          title
          createdAt
          featuredImage {
            small: transformedSrc(maxWidth: 180)
          }
        }
      }
    }
  }
  `
  const response = await shopifyGqlRequest({query, variables: {qryParam: qryParam}});

  if (!response) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: 'Couldn\'t fetch products...'})
    }
  }

  return response
}

export async function loadProducts(ids) {
  const queryList = ids.map((curr, idx) => {
    let key = gql`productVariant${Number(idx) + 1}`
    let value = gql`productVariant(id: ${curr}) {id price}`

    return gql`${key}: ${value}`
  }, {})
  const queryObject = { queryList }
  console.log(queryObject)
  const query = gql`
  query {
    productVariant1: productVariant(id: "gid:\/\/shopify\/ProductVariant\/42496976781558") {
      id
      price
    },
    productVariant2: productVariant(id: "gid:\/\/shopify\/ProductVariant\/42900036387062") {
      id
      price
    },
    productVariant3: productVariant(id: "gid:\/\/shopify\/ProductVariant\/44108343738614") {
      id
      price
    }
  }
  `;
  console.log('the query', query)
  const response = await shopifyAdminGqlRequest({query, variables: {}});

  if (!response) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: 'Couldn\'t fetch products...'})
    }
  }
  console.log('response', response)
  return response
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



