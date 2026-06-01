/**
 * AI model factory using the Vercel AI SDK.
 * Maps model string identifiers to provider instances.
 * API keys are stored encrypted in the `ai_provider_keys` Supabase table
 * and decrypted server-side on each call.
 *
 * Same implementation pattern as the WebsiteDev reference project.
 */
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createAzure } from '@ai-sdk/azure';
import type { LanguageModel } from 'ai';
import { decrypt } from '@/lib/encryption';
import { getServiceClient } from '@/lib/supabase';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'azure';

export interface ModelOption {
  id: string;
  label: string;
  provider: AIProvider;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)', provider: 'openai' },
  { id: 'gpt-4.1', label: 'GPT-4.1 (OpenAI)', provider: 'openai' },
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Anthropic)', provider: 'anthropic' },
  { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Anthropic)', provider: 'anthropic' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Google)', provider: 'google' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Google)', provider: 'google' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)', provider: 'groq' },
  { id: 'azure-deployment', label: 'Azure OpenAI (configured deployment)', provider: 'azure' },
];

/** The model used for transcript interpretation when no DB config overrides it */
export const DEFAULT_INTERPRETATION_MODEL = 'claude-sonnet-4-20250514';

/** Fetch decrypted API keys for all active providers from the database, merged with env vars */
export async function getActiveProviderKeys(): Promise<Record<string, string>> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('ai_provider_keys')
    .select('provider, api_key_enc')
    .eq('active', true);

  const keys: Record<string, string> = {};
  for (const row of data ?? []) {
    try {
      keys[row.provider] = decrypt(row.api_key_enc);
    } catch {
      // Skip rows with corrupted / mis-keyed ciphertext
    }
  }

  // Fall back to environment variables if no DB key is present for a provider
  const envFallbacks: Array<[AIProvider, string | undefined]> = [
    ['anthropic', process.env.ANTHROPIC_API_KEY],
    ['openai', process.env.OPENAI_API_KEY],
    ['google', process.env.GOOGLE_API_KEY],
    ['groq', process.env.GROQ_API_KEY],
  ];
  for (const [provider, envKey] of envFallbacks) {
    if (envKey && envKey.trim() && !keys[provider]) {
      keys[provider] = envKey.trim();
    }
  }

  return keys;
}

/** Return the list of currently active provider names (for admin tooling) */
export async function getActiveProviders(): Promise<AIProvider[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('ai_provider_keys')
    .select('provider')
    .eq('active', true);
  return (data ?? []).map((r) => r.provider as AIProvider);
}

/**
 * Return a Vercel AI SDK LanguageModel for the given model ID.
 * Keys are loaded from the database; throws if the provider has no active key.
 */
export async function getModel(modelId: string): Promise<LanguageModel> {
  const keys = await getActiveProviderKeys();
  const option = MODEL_OPTIONS.find((m) => m.id === modelId);
  if (!option) throw new Error(`Unknown model: ${modelId}`);

  const apiKey = keys[option.provider];
  if (!apiKey) throw new Error(`No active API key for provider: ${option.provider}`);

  switch (option.provider) {
    case 'openai':
      return createOpenAI({ apiKey })(modelId);

    case 'anthropic':
      return createAnthropic({ apiKey })(modelId);

    case 'google':
      return createGoogleGenerativeAI({ apiKey })(modelId);

    case 'groq':
      return createGroq({ apiKey })(modelId);

    case 'azure': {
      // The api_key_enc for Azure holds a JSON-encoded config object:
      // {
      //   "apiKey": "...",
      //   "resourceName": "my-azure-resource",   // OR use endpointUrl
      //   "deploymentName": "gpt-4o",
      //   "endpointUrl": "https://my-resource.openai.azure.com",  // optional
      //   "apiVersion": "2024-12-01-preview"     // optional
      // }
      const config = JSON.parse(apiKey) as {
        apiKey: string;
        resourceName: string;
        deploymentName: string;
        endpointUrl?: string;
        apiVersion?: string;
      };
      const apiVersion = config.apiVersion ?? '2024-12-01-preview';
      const baseURL = config.endpointUrl
        ? config.endpointUrl.replace(/\/$/, '') + '/openai'
        : undefined;
      const azureProvider = createAzure({
        ...(baseURL ? { baseURL } : { resourceName: config.resourceName }),
        apiKey: config.apiKey,
        apiVersion,
        // Forces /deployments/{id}/chat/completions — avoids /responses endpoint
        // which is not supported on all Azure OpenAI resource tiers.
        useDeploymentBasedUrls: true,
      });
      return azureProvider.chat(config.deploymentName);
    }

    default:
      throw new Error(`Unsupported provider: ${option.provider}`);
  }
}

/**
 * Convenience: return the best available interpretation model.
 * Prefers the configured default; falls back through the active providers in order.
 */
export async function getBestInterpretationModel(): Promise<LanguageModel> {
  const keys = await getActiveProviderKeys();

  // Try the default model first
  const defaultOption = MODEL_OPTIONS.find((m) => m.id === DEFAULT_INTERPRETATION_MODEL);
  if (defaultOption && keys[defaultOption.provider]) {
    return getModel(DEFAULT_INTERPRETATION_MODEL);
  }

  // Fall back through providers in priority order
  const fallbackOrder: AIProvider[] = ['azure', 'openai', 'anthropic', 'google', 'groq'];
  for (const provider of fallbackOrder) {
    if (keys[provider]) {
      const option = MODEL_OPTIONS.find((m) => m.provider === provider);
      if (option) return getModel(option.id);
    }
  }

  throw new Error(
    'No active AI provider keys found. Add at least one provider key to the ai_provider_keys table.'
  );
}
