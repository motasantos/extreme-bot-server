import config from '../config/config';
import RedisManager from '../redis/RedisManager';
import { openaiClient } from './openaiClient';
import {AssistantParams} from '../interfaces/AssistantParams';

class OpenAIChatManager {
    private redisManager: RedisManager;
    private assistantKey = config.openAiAssistantKey;
    private assistantId?: string;
    private maxRunAttempts = 5; // Máximo de tentativas para o run


    constructor(redisManager: RedisManager, assistantParams: AssistantParams) {
        this.redisManager = redisManager;
        this.initializeAssistant(assistantParams).catch(error => console.error('Error initializing assistant:', error));
    }

    private async initializeAssistant(params: AssistantParams): Promise<void> {
        const assistantExists = await this.checkAssistantExists(params.name);
        if (!assistantExists) {
            await this.createAssistantInOpenAI(params);
        }
    }
    
    private async checkAssistantExists(assistantName: string): Promise<boolean> {
        const assistantData = await this.redisManager.get(assistantName);
        if (assistantData) {
            this.assistantId = JSON.parse(assistantData).id;
            return true;
        }
        return false;
    }
    
    private async createAssistantInOpenAI(params: AssistantParams): Promise<void> {
        try {
            const newAssistant = await openaiClient.beta.assistants.create(params);
            this.assistantId = newAssistant.id;
            await this.redisManager.set(params.name, JSON.stringify({ ...params, id: newAssistant.id }));
        } catch (error) {
            console.error("Erro ao criar assistente na OpenAI:", error);
            throw error;
        }
    }
    

    async getOrCreateThread(threadId: string | null): Promise<string> {
        if (!threadId) {
            const thread = await openaiClient.beta.threads.create();
            return thread.id;
        } else {
            // Verificar se o threadId fornecido é válido
            try {
                const existingThread = await openaiClient.beta.threads.retrieve(threadId);
                return existingThread.id;
            } catch {
                // Se não for válido, criar uma nova thread
                const thread = await openaiClient.beta.threads.create();
                return thread.id;
            }
        }
    }

    async sendMessageAndGetResponse(threadId: string | null, message: string): Promise<{ response: string, threadId: string }> {
        const validThreadId = await this.getOrCreateThread(threadId);
    
        await openaiClient.beta.threads.messages.create(validThreadId, {
            role: 'user',
            content: message
        });
    
        const run = await openaiClient.beta.threads.runs.create(validThreadId, {
            assistant_id: this.assistantId || '' // Certifique-se de que this.assistantId seja uma string válida ou defina um valor padrão
        });
    
        let runStatus;
        let attempts = 0;
        do {
            await new Promise(resolve => setTimeout(resolve, 500));
            const runDetails = await openaiClient.beta.threads.runs.retrieve(validThreadId, run.id);
            runStatus = runDetails.status;
            if (runStatus === 'failed') {
                throw new Error("Falha na execução do assistente: " + JSON.stringify(run));
            }
            attempts++;
        } while (runStatus !== 'completed' && attempts < this.maxRunAttempts);
    
        if (runStatus !== 'completed') {
            throw new Error("Falha ao obter resposta do assistente.");
        }
    
        // Recuperar a lista de mensagens e encontrar a última mensagem do assistente
        const messages = await openaiClient.beta.threads.messages.list(validThreadId);
        const lastAssistantMessage = messages.data.reverse().find((m: any) => m.role === 'assistant')?.content;
    
        const lastMessageContent = lastAssistantMessage && typeof lastAssistantMessage === 'string' ? lastAssistantMessage : '';
        return { response: lastMessageContent, threadId: validThreadId };
    }
    }

export default OpenAIChatManager;
