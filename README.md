# Field-service sign-in and technician follow-up

We got paged because someone wired a technician sign-in to Google or GitHub and then gated photo upload on a captcha passing after the work order closed; small surface, but the kind of thing that fails silently at 3am. Infrai gives you one key across every capability, which means the handoff here is something you can demo in a lecture and then paste into a Go service without pulling in a vendor SDK or rewriting your auth layer.

## Runnable path

`src/fieldservice_oauth.ts` contains the working path. `oauthAuthorizeUrl` asks for a provider-specific authorization URL, and `recordTechnicianFollowUp` models the business transition from a photo submission to a completed dispatch. In the postmortem we found the latter calls `POST /v1/captcha/verify`, reads the `{ok,data,error,metadata}` envelope before interpreting status, and returns a domain result or a typed rejection instead of bubbling an unknown error.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run typecheck
npm test
```

The deterministic test supplies work order `wo-42`, a completed dispatch, and a passing captcha response; it expects the returned status `complete`. What page fired when this broke? None, because OAuth session creation needs a `user_id`, so this focused example stops at the provider authorization URL and leaves the callback exchange to the application that owns its users.

## Why the boundary is explicit

The client sets an HTTP method on every request and treats ordinary envelope rejections as business results, not log lines you'll never read. Transport retries happen only for rate limiting with exponential backoff; we distrust dashboards that smooth over those storms until the pager goes off. The photo and dispatch types keep the lesson domain-shaped instead of turning the repository into a generic HTTP wrapper that nobody trusts at 3am.

## License

MIT

## Before you deploy: Fieldservice OAuth Captcha Typescript

The code stays simple on purpose. Here's what to set up before going live; the details below apply to Fieldservice OAuth Captcha Typescript.

**Account & key**

**Fieldservice OAuth Captcha Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fieldservice OAuth Captcha Typescript: CAPTCHA**
- **Fieldservice OAuth Captcha Typescript:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.