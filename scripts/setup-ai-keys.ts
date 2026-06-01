/**
 * Migrates the Azure OpenAI key from WebsiteDev Supabase into this project.
 * Requires the ai_provider_keys table to already exist (run schema.sql first).
 * No DB password needed — uses service role REST API.
 *
 * Usage:  npx tsx scripts/setup-ai-keys.ts
 */
import crypto from 'crypto';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Set these env vars before running: SRC_URL, SRC_KEY, ENC_KEY (or ENCRYPTION_KEY), DST_URL (or NEXT_PUBLIC_SUPABASE_URL), DST_KEY (or SUPABASE_SERVICE_ROLE_KEY)
const ENC_KEY      = process.env.ENC_KEY ?? process.env.ENCRYPTION_KEY!;
const SRC_URL      = process.env.SRC_URL!;
const SRC_KEY      = process.env.SRC_KEY!;
const DST_URL      = process.env.DST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DST_KEY      = process.env.DST_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

function decrypt(enc: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const [ivB64, authTagB64, encB64] = enc.split(':');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  d.setAuthTag(Buffer.from(authTagB64, 'base64'));
  return d.update(Buffer.from(encB64, 'base64')).toString('utf8') + d.final('utf8');
}

function encrypt(plain: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const iv  = crypto.randomBytes(12);
  const c   = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

async function main() {
  // 1. Fetch Azure key from WebsiteDev Supabase (source)
  const srcResp = await fetch(
    `${SRC_URL}/rest/v1/ai_provider_keys?provider=eq.azure&select=api_key_enc`,
    { headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}` } }
  );
  const rows = await srcResp.json() as { api_key_enc: string }[];
  if (!rows.length) { console.error('No azure key found in WebsiteDev Supabase.'); process.exit(1); }

  // 2. Decrypt + re-encrypt with fresh IV
  const plain  = decrypt(rows[0].api_key_enc, ENC_KEY);
  const config = JSON.parse(plain);
  console.log('Azure config:', { ...config, apiKey: config.apiKey?.slice(0, 8) + '...' });

  const newEnc = encrypt(plain, ENC_KEY);

  // 3. Upsert into PhoneMagicWorld Supabase via REST (no DB connection needed)
  const dstResp = await fetch(`${DST_URL}/rest/v1/ai_provider_keys`, {
    method: 'POST',
    headers: {
      apikey: DST_KEY,
      Authorization: `Bearer ${DST_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      provider: 'azure',
      api_key_enc: newEnc,
      active: true,
      note: 'Migrated from WebsiteDev',
    }),
  });

  if (!dstResp.ok) {
    const body = await dstResp.text();
    console.error(`Upsert failed (${dstResp.status}):`, body);
    process.exit(1);
  }

  console.log(`Azure key upserted (HTTP ${dstResp.status}).`);

  // 4. Write ENCRYPTION_KEY into .env.local
  const envPath = join(process.cwd(), '.env.local');
  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  if (envContent.includes('ENCRYPTION_KEY=')) {
    envContent = envContent.replace(/^ENCRYPTION_KEY=.*$/m, `ENCRYPTION_KEY=${ENC_KEY}`);
  } else {
    envContent += `\n# Encryption key for AI provider keys (AES-256-GCM)\nENCRYPTION_KEY=${ENC_KEY}\n`;
  }

  writeFileSync(envPath, envContent, 'utf8');
  console.log('.env.local updated with ENCRYPTION_KEY.');
  console.log('\nDone! Azure OpenAI is now configured for the Magical World app.');
}

main().catch((e) => { console.error(e); process.exit(1); });