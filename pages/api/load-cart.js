import { shopifyGqlRequest } from "../../lib/shopify";

export async function handler(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({message: 'TODO'})
  };
  
}