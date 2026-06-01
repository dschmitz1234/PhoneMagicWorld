import crypto from 'crypto';

// Set these env vars before running: SRC_SUPABASE_URL, SRC_SERVICE_KEY, SRC_ENC_KEY, DST_SUPABASE_URL, DST_SERVICE_KEY
const SRC_SUPABASE_URL = process.env.SRC_SUPABASE_URL!;
const SRC_SERVICE_KEY  = process.env.SRC_SERVICE_KEY!;
const SRC_ENC_KEY      = process.env.SRC_ENC_KEY ?? process.env.ENCRYPTION_KEY!;

const DST_SUPABASE_URL = process.env.DST_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DST_SERVICE_KEY  = process.env.DST_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DST_ENC_KEY      = process.env.ENCRYPTION_KEY!;

function decrypt(encoded: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const [ivB64, authTagB64, encB64] = encoded.split(':');
  const iv      = Buffer.from(ivB64,      'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const enc     = Buffer.from(encB64,     'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(authTag);
  return d.update(enc).toString('utf8') + d.final('utf8');
}

function encrypt(plaintext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const iv  = crypto.randomBytes(12);
  const c   = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(plaintext, 'utf8'), c.final()]);
  return [iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

async function main() {
  // 1. Fetch Azure key from WebsiteDev Supabase
  const fetchResp = await fetch(
    `${SRC_SUPABASE_URL}/rest/v1/ai_provider_keys?provider=eq.azure&select=api_key_enc`,
    { headers: { apikey: SRC_SERVICE_KEY, Authorization: `Bearer ${SRC_SERVICE_KEY}` } }
  );
  const rows = await fetchResp.json() as { api_key_enc: string }[];

  if (!rows.length) {
    console.error('No azure key row found in WebsiteDev Supabase.');
    process.exit(1);
  }

  const row = rows[0];

  // 2. Decrypt to reveal plaintext config
  const plaintext = decrypt(row.api_key_enc, SRC_ENC_KEY);
  const config = JSON.parse(plaintext);
  console.log('Azure config (redacted):', { ...config, apiKey: config.apiKey?.slice(0, 8) + '...' });

  // 3. Re-encrypt with destination key (new random IV)
  const newEnc = encrypt(plaintext, DST_ENC_KEY);

  // 4. Upsert into PhoneMagicWorld Supabase
  const upsertResp = await fetch(
    `${DST_SUPABASE_URL}/rest/v1/ai_provider_keys`,
    {
      method: 'POST',
      headers: {
        apikey: DST_SERVICE_KEY,
        Authorization: `Bearer ${DST_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        provider: 'azure',
        api_key_enc: newEnc,
        active: true,
        note: 'Migrated from WebsiteDev',
      }),
    }
  );

  if (!upsertResp.ok) {
    const body = await upsertResp.text();
    console.error('Upsert failed:', upsertResp.status, body);
    process.exit(1);
  }

  console.log(`Upserted azure key. HTTP ${upsertResp.status}`);
  console.log('ENCRYPTION_KEY:', DST_ENC_KEY);
}

main().catch((e) => { console.error(e); process.exit(1); });
