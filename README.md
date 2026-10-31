# OnlySocial API docs

The developer documentation at api.onlysocial.io: the Messaging, Publishing and Link in Bio APIs,
webhooks, the MCP server and the Partner API. Built with Mintlify; pushes to `main` deploy
automatically.

## Rules

- Document only what is shipped and switched on for main OnlySocial (app.onlysocial.io). Plans and
  rollout notes stay in the app repo.
- Use `app.onlysocial.io` in examples, and `/os/` for the Publishing API's dashboard path.

## Local preview

```bash
npx mint dev
```

## Where the pages come from

Most of the Guides tab and the three API references are shared with the brand-neutral docs in
`ccwl-docs`. Change those pages there, then bring them here:

```bash
node scripts/sync-from-ccwl.mjs ../ccwl-docs
```

The script copies only the files in its `SHARED` list and brands them (domain, "your platform" →
OnlySocial, the OpenAPI server URLs, and OnlySocial's longer "Older credentials" section). It warns
when one of its sentence rules no longer matches. Review the diff before committing.

OnlySocial's own pages are never overwritten: `docs.json`, `index.mdx`, the `mcp/` tab, and the
Partner tab (`partner/overview`, `authentication`, `single-sign-on`, `workspace-api-keys` and
`api-reference/partner.openapi.json`). `partner/channel-connect.mdx` is shared.

## Old Apidog links

The site used to be on Apidog. `docs.json` redirects its `/doc-…` and `/api-…` page addresses to the
matching pages here; the Groups and admin-panel endpoints it listed are not part of the public API and
redirect to the home page.

## Regenerating the Messaging API reference

`api-reference/messaging.openapi.json` is generated in ccwl-docs from the app repo's
`docs/api/manifest/*.json` (see its README), then synced here.
