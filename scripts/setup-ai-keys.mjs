/**
 * Migrates the Azure OpenAI key from WebsiteDev Supabase into this project.
 * Requires the ai_provider_keys table to already exist (run the SQL in Supabase dashboard first).
 * No DB password needed - uses service role REST API.
 *
 * Usage:  npx tsx scripts/setup-ai-keys.ts
 */
import crypto from 'crypto';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Set these env vars before running: SRC_URL, SRC_KEY, ENC_KEY (or ENCRYPTION_KEY), DST_URL (or NEXT_PUBLIC_SUPABASE_URL), DST_KEY (or SUPABASE_SERVICE_ROLE_KEY)
const ENC_KEY = process.env.ENC_KEY ?? process.env.ENCRYPTION_KEY;
const SRC_URL = process.env.SRC_URL;
const SRC_KEY = process.env.SRC_KEY;
const DST_URL = process.env.DST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const DST_KEY = process.env.DST_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function decrypt(enc, hexKey) {
  const key = Buffer.from(hexKey, 'hex');
  const [a, b, c] = enc.split(':');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(a, 'base64'));
  d.setAuthTag(Buffer.from(b, 'base64'));
  return d.update(Buffer.from(c, 'base64')).toString('utf8') + d.final('utf8');
}

function reencrypt(plain, hexKey) {
  const key = Buffer.from(hexKey, 'hex');
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

async function main() {
  const srcResp = await fetch(SRC_URL + '/rest/v1/ai_provider_keys?provider=eq.azure&select=api_key_enc', {
    headers: { apikey: SRC_KEY, Authorization: 'Bearer ' + SRC_KEY }
  });
  const rows = await srcResp.json();
  if (!rows.length) { console.error('No azure key found in WebsiteDev Supabase.'); process.exit(1); }
  const plain = decrypt(rows[0].api_key_enc, ENC_KEY);
  const config = JSON.parse(plain);
  console.log('Azure config:', { ...config, apiKey: config.apiKey.slice(0, 8) + '...' });
  const newEnc = reencrypt(plain, ENC_KEY);
  const dstResp = await fetch(DST_URL + '/rest/v1/ai_provider_keys', {
    method: 'POST',
    headers: { apikey: DST_KEY, Authorization: 'Bearer ' + DST_KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ provider: 'azure', api_key_enc: newEnc, active: true, note: 'Migrated from WebsiteDev' })
  });
  if (!dstResp.ok) {
    console.error('Upsert failed (' + dstResp.status + '):', await dstResp.text());
    console.error('Have you run the CREATE TABLE SQL in the Supabase Dashboard?');
    process.exit(1);
  }
  console.log('Azure key upserted (HTTP ' + dstResp.status + ').');
  const envPath = join(process.cwd(), '.env.local');
  let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  if (env.includes('ENCRYPTION_KEY=')) {
    env = env.replace(/^ENCRYPTION_KEY=.*$/m, 'ENCRYPTION_KEY=' + ENC_KEY);
  } else {
    env += '\nENCRYPTION_KEY=' + ENC_KEY + '\n';
  }
  writeFileSync(envPath, env, 'utf8');
  console.log('.env.local written with ENCRYPTION_KEY.');
  console.log('Done! Azure OpenAI is configured for the Magical World app.');
}

main().catch(e => { console.error(e); process.exit(1); });
