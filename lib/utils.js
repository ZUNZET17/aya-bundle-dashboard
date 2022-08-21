import axios from 'axios';

export async function fetchDiscounts (token) {
  const config = {
    headers: {
      Authorization: `Bearer ${token }`
    }
  }

  const url = 'http://localhost:1337/api/discount-lists'

  const response = await axios.get(url, config)
    .then(res => {console.log(res.data.data); return res.data.data})
    .catch(err => console.log(err));
  
  return response
}