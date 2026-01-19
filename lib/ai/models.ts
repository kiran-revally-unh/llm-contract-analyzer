// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'Latest and most capable GPT-4o model',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'chatgpt-4o-latest',
    label: 'ChatGPT 4o Latest',
    apiIdentifier: 'chatgpt-4o-latest',
    description: 'Dynamic model - always points to latest GPT-4o',
  },
  {
    id: 'gpt-4-turbo',
    label: 'GPT 4 Turbo',
    apiIdentifier: 'gpt-4-turbo',
    description: 'Most capable GPT-4 model with 128k context',
  },
  {
    id: 'gpt-4',
    label: 'GPT 4',
    apiIdentifier: 'gpt-4',
    description: 'Standard GPT-4 model for advanced tasks',
  },
  {
    id: 'gpt-3.5-turbo',
    label: 'GPT 3.5 Turbo',
    apiIdentifier: 'gpt-3.5-turbo',
    description: 'Fast and efficient for most conversations',
  },
  {
    id: 'o1',
    label: 'o1',
    apiIdentifier: 'o1',
    description: 'Latest reasoning model for complex problems',
  },
  {
    id: 'o1-preview',
    label: 'o1 Preview',
    apiIdentifier: 'o1-preview',
    description: 'Preview reasoning model for complex problems',
  },
  {
    id: 'o1-mini',
    label: 'o1 Mini',
    apiIdentifier: 'o1-mini',
    description: 'Faster reasoning model for coding and STEM',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';
