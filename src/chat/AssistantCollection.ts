import OpenAIChatManager from "../openai/OpenAIChatManager";
import RedisManager from "../redis/RedisManager";
import {AssistantParams} from '../interfaces/AssistantParams';

class AssistantCollection {
    // Mapa aninhado: Cliente ID -> (Tipo de Assistente -> OpenAIChatManager)
    private assistantManagers: Map<string, Map<string, OpenAIChatManager>>;
    private redisManager: RedisManager;

    constructor(redisManager: RedisManager) {
        this.redisManager = redisManager; 
        this.assistantManagers = new Map();
    }

    async createOrUpdateAssistant(clientId: string, assistantType: string, assistantParams: AssistantParams): Promise<string> {
        // Verificar se o assistente já existe para este cliente
        const assistantId = await this.redisManager.hget(`cliente:${clientId}:assistants`, assistantType);

        if (assistantId) {
            // Assistente já existe, então atualizar os parâmetros
            await this.updateAssistant(clientId, assistantType, assistantParams);
            return assistantId;
        } else {
            // Criar um novo assistente
            return this.createAssistant(clientId, assistantType, assistantParams);
        }
    }

    private async createAssistant(clientId: string, assistantType: string, assistantParams: AssistantParams): Promise<string> {
        const chatManager = new OpenAIChatManager(this.redisManager, assistantParams);
        const threadId = await chatManager.getOrCreateThread(null);

        await this.redisManager.hset(`cliente:${clientId}:assistants`, assistantType, threadId);

        return threadId;
    }

    private async updateAssistant(clientId: string, assistantType: string, assistantParams: AssistantParams): Promise<void> {
        const assistantId = await this.redisManager.hget(`cliente:${clientId}:assistants`, assistantType);

        if (!assistantId) {
            throw new Error('Assistente não encontrado');
        }

        // Atualizar os parâmetros do assistente no Redis
        await this.redisManager.hset(`cliente:${clientId}:assistants`, assistantType, JSON.stringify(assistantParams));


        // Se necessário, também atualizar os parâmetros do assistente na OpenAI
        // Isso pode envolver chamar um método na classe OpenAIChatManager para atualizar os parâmetros
    }

    async getAssistantManager(clientId: string, assistantType: string, assistantParams: AssistantParams): Promise<OpenAIChatManager> {
        // Verificar se existe um mapa para este clientId
        if (!this.assistantManagers.has(clientId)) {
            this.assistantManagers.set(clientId, new Map<string, OpenAIChatManager>());
        }

        const typeManagers = this.assistantManagers.get(clientId)!;

        // Se o tipo específico de assistente não estiver presente, criá-lo e adicioná-lo ao mapa
        if (!typeManagers.has(assistantType)) {
            const chatManager = new OpenAIChatManager(this.redisManager, assistantParams);
            typeManagers.set(assistantType, chatManager);
        }

        return typeManagers.get(assistantType)!;
    }

    // Adicione métodos adicionais conforme necessário, por exemplo, para remover assistentes ou listar todos os tipos de assistentes para um cliente
}

export default AssistantCollection;
