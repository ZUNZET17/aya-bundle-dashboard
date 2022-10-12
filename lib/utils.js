import axios from 'axios';

export async function fetchDiscounts (token, endpoint) {
  const strapi_url = process.env.NEXT_PUBLIC_STRAPI_URL
  const config = {
    headers: {
      Authorization: `Bearer ${token }`
    }
  }

  const url = `${strapi_url}/api/${endpoint}`

  const response = await axios.get(url, config)
    .then(res => {console.log(res.data.data); return res.data.data})
    .catch(err => console.log(err));
  
  return response
}