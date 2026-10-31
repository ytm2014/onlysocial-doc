#!/usr/bin/env node
/*
 * Copy the pages OnlySocial shares with the brand-neutral docs (ccwl-docs) and brand them for
 * OnlySocial.
 *
 *   node scripts/sync-from-ccwl.mjs [path-to-ccwl-docs]        (default: ../ccwl-docs)
 *
 * Only the files in SHARED are touched. Everything else in this repo (docs.json, the home page,
 * authentication, the MCP and Partner tabs) is OnlySocial's own and is never overwritten.
 * Review the diff before committing: a new brand-neutral phrase may need a rule in REPLACE.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(process.argv[2] || join(ROOT, '..', 'ccwl-docs'));
const DOMAIN = 'app.onlysocial.io';

const SHARED = [
  'quickstart.mdx',
  'authentication.mdx',
  'errors-and-limits.mdx',
  'ad-referrals.mdx',
  'zapier.mdx',
  'webhooks/overview.mdx',
  'webhooks/verify-signatures.mdx',
  'webhooks/events.mdx',
  'webhooks/manage.mdx',
  'biolinks/overview.mdx',
  'partner/channel-connect.mdx',
  'api-reference/messaging.openapi.json',
  'api-reference/publishing.openapi.json',
  'api-reference/biolinks.openapi.json',
  'scripts/build-messaging-openapi.mjs',
];

// OnlySocial customers integrated with personal access tokens long before workspace keys existed,
// so the short "Older credentials" note becomes a table that says where each one comes from.
const OLDER_CREDENTIALS = `Integrations built before workspace API keys keep working with their own credentials, on their own API, as before. They are never converted or expired automatically.

| Credential | Where it comes from | Works with |
| --- | --- | --- |
| Personal access token | **Access Tokens** in your user menu | The Publishing API and the [MCP server](/mcp/overview). Send it as \`Authorization: Bearer\` only. |
| Messaging key (\`sbk_…\`) | The REST API page, before workspace keys were switched on | The Messaging API and Zapier |

To move an integration to a workspace key: create the key, update the integration, check a read and a safe write, then revoke the old credential.`;

// Applied in order, to every shared file. Sentences first, then the generic phrases. A sentence
// rule (40+ characters) that matches nothing is reported: ccwl-docs reworded it and the rule needs
// updating.
const REPLACE = [
  ['Personal publishing tokens and messaging keys starting with `sbk_` keep working on their own API as before. They are never converted or expired automatically. To move an integration to a workspace key: create the key, update the integration, check a read and a safe write, then revoke the old credential.', OLDER_CREDENTIALS],
  ['  <Step title="Find your domain">\n    Your API lives on the same domain you sign in to. In the examples below, replace `app.example.com` with it.\n  </Step>\n', ''],
  ['If your platform offers the Zapier app, you can connect it', 'If the Zapier integration is on for your workspace, you can connect it'],
  ['Which platforms are available depends on how the instance is configured', 'Which platforms are available depends on how OnlySocial is configured'],
  ['That platform is not available on this instance.', 'That platform is not available on OnlySocial.'],
  ['The platform is not set up on this instance for that channel. Contact the operator.', 'The platform is not set up for that channel yet. Contact OnlySocial support.'],
  ["or the bot is the\nplatform's own bot", "or the bot is\nOnlySocial's own bot"],
  // Every other Partner tab page has an icon; give Channel Connect one, and a description that
  // covers all the platforms the page documents.
  ['description: "Give a customer a link that connects their own WhatsApp number, with no dashboard login."\n---', 'description: "Give a customer a link that connects their own WhatsApp, Facebook, Instagram or TikTok account, or connect a Telegram bot, with no dashboard login."\nicon: "plug"\n---'],
  ['Only on instances where partner-initiated channel onboarding is switched on, and\nonly for connections a partner started.', 'Only for connections a partner started through\nChannel Connect.'],
  // OnlySocial keeps analytics on, so the notes for platforms that turn them off go.
  [' If your platform has turned analytics off, every analytics endpoint answers `404`.', ''],
  ['"Unknown workspace, account or post, or analytics are turned off."', '"Unknown workspace, account or post."'],
  ['. Not offered where your platform has turned analytics off |', ' |'],
  ['Your platform domain', 'OnlySocial'],
  ['your platform has', 'OnlySocial has'],
  ['Your platform can', 'OnlySocial can'],
  ['The platform records', 'OnlySocial records'],
  ['the platform', 'OnlySocial'],
  ['app.example.com', DOMAIN],
];

const matched = new Set();

function brand(text) {
  return REPLACE.reduce((out, [from, to]) => {
    if (out.includes(from)) matched.add(from);
    return out.split(from).join(to);
  }, text);
}

function brandOpenApi(text) {
  const spec = JSON.parse(text);
  // The shared specs use https://{domain}/... with a domain variable; OnlySocial has one domain.
  spec.servers = (spec.servers || []).map((server) => ({
    url: server.url.split('https://{domain}').join(`https://${DOMAIN}`),
    description: 'OnlySocial',
  }));
  return brand(JSON.stringify(spec, null, 2)) + '\n';
}

if (!existsSync(join(SOURCE, 'docs.json'))) {
  console.error(`No ccwl-docs checkout at ${SOURCE}. Pass its path as the first argument.`);
  process.exit(1);
}

for (const file of SHARED) {
  // A Windows checkout may have CRLF line endings; the rules (and this repo) use LF.
  const text = readFileSync(join(SOURCE, file), 'utf8').replace(/\r\n/g, '\n');
  const out = file.endsWith('.openapi.json') ? brandOpenApi(text) : brand(text);
  mkdirSync(dirname(join(ROOT, file)), { recursive: true });
  writeFileSync(join(ROOT, file), out);
  console.log(`synced ${file}`);
}

const unmatched = REPLACE.filter(([from]) => from.length >= 40 && !matched.has(from));
for (const [from] of unmatched) {
  console.warn(`\nWARNING: no longer in ccwl-docs, update or remove this rule:\n  ${from.slice(0, 100).replace(/\n/g, '\\n')}…`);
}

console.log(`\nDone. Check the diff for leftover brand-neutral wording ("your platform", "instance", "${'app.example'}").`);
