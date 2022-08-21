import axios from 'axios';
import { setCookie } from 'nookies'

export default async (req, res) => {
  const strapi_url = process.env.NEXT_PUBLIC_STRAPI_URL
  const { password, identifier } = JSON.parse(req.body);

  try {
    const postRes = await axios.post(`${strapi_url}/api/auth/local`, {
      identifier,
      password,
    })

    setCookie({ res }, 'jwt', postRes.data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    res.status(200).end();
  } catch (error) {
    console.log(error.response.data)
    res.status(400).send(error.response.data);
  }
}