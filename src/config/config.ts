import dotenv from 'dotenv';

dotenv.config();

interface Config {
    openaiApiKey: string;
    openAiAssistantKey: string;
    redisHost: string;
    redisPort: number;
    redisPassword: string;
}

const config: Config = {
    openaiApiKey: process.env.OPENAI_API_KEY || '', // Corrigido para OPENAI_API_KEY
    openAiAssistantKey: process.env.OPENAI_ASSISTANT_KEY || '', // Corrigido para OPENAI_ASSISTANT_KEY
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),
    redisPassword: process.env.REDIS_PASSWORD || '',
};

export default config;
