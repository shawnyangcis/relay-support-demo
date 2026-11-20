export function GET() {
  return Response.json({
    configured: Boolean(
      process.env.CHAT_API_KEY ||
        process.env.VERCEL ||
        process.env.AI_GATEWAY_API_KEY ||
        process.env.VERCEL_OIDC_TOKEN,
    ),
  });
}
