import Redis from 'ioredis';
import config from '../config/config';

class RedisManager {
    private redisClient: Redis;

    constructor() {
        this.redisClient = new Redis({
            host: config.redisHost,
            port: config.redisPort,
            password: config.redisPassword,
            retryStrategy: times => Math.min(times * 50, 2000)
        });

    }

    async hset(key: string, field: string, value: string): Promise<number | null> {
        try {
            return await this.redisClient.hset(key, field, value);
        } catch (error) {
            console.error('Error setting value in Redis hash:', error);
            return null;
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.redisClient.get(key);
        } catch (error) {
            console.error('Error getting value from Redis:', error);
            return null;
        }
    }

    async set(key: string, value: string): Promise<'OK' | null> {
        try {
            return await this.redisClient.set(key, value);
        } catch (error) {
            console.error('Error setting value in Redis:', error);
            return null;
        }
    }

    async hget(key: string, field: string): Promise<string | null> {
        try {
            return await this.redisClient.hget(key, field);
        } catch (error) {
            console.error('Error getting value from Redis hash:', error);
            return null;
        }
    }
    

    async updateInteraction(userId: string, assistantName: string, threadId: string) {
        const key = `users-interaction:${userId}`;
        const currentTime = Date.now();
        const interactionData = { threadId, lastInteraction: currentTime };
    
        // Verificar se é para usar Hash ou String
        await this.redisClient.hset(key, assistantName, JSON.stringify(interactionData)); // Para Hash
        // Ou para String, obter o objeto atual, atualizá-lo e regravá-lo
    }
    

    // Este método permanece útil para obter o threadId pelo phoneNumber
    // Mas agora, ele não tenta mais criar um novo thread diretamente, essa responsabilidade é do OpenAIChatManager
    async getThreadIdByPhoneNumber(phoneNumber: string): Promise<string | null> {
        return await this.redisClient.get(phoneNumber);
    }
}

export default RedisManager;
