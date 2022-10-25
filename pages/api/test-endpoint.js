import NextCors from "nextjs-cors";
export default async function handler(req, res) {
  await NextCors(req, res, {
    // Options
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  res.status(200).json({
    message: 'test endpoint',
    body: 'test body'
  })
}