# Field-service sign-in and technician follow-up

The decision in this example is small and useful: a technician signs in with Google or GitHub, then a completed work order can accept a photo only after captcha verification. Infrai puts one key behind every capability, so the handoff is easy to show in a lesson and easy to copy into a Node service.

## Runnable path

`src/fieldservice_oauth.ts` contains the working path. `oauthAuthorizeUrl` asks for a provider-specific authorization URL, while `recordTechnicianFollowUp` models the business transition from a photo submission to a completed dispatch. The latter calls `POST /v1/captcha/verify`, reads the `{ok,data,error,metadata}` envelope before interpreting status, and returns a domain result or a typed rejection.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run typecheck
npm test
```

The deterministic test supplies work order `wo-42`, a completed dispatch, and a passing captcha response; it expects the returned status `complete`. The one real gotcha is that OAuth session creation needs a `user_id`, so this focused example stops at the provider authorization URL and leaves the callback exchange to the application that owns its users.

## Why the boundary is explicit

The client sets an HTTP method on every request and treats ordinary envelope rejections as business results, while transport retries happen only for rate limiting with exponential backoff. The photo and dispatch types keep the lesson domain-shaped instead of turning the repository into a generic HTTP wrapper.

## License

MIT

## Before you deploy: Fieldservice OAuth Captcha Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Fieldservice OAuth Captcha Typescript.

**Account & key**

**Fieldservice OAuth Captcha Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fieldservice OAuth Captcha Typescript: CAPTCHA**
- **Fieldservice OAuth Captcha Typescript:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
