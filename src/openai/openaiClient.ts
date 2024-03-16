import config from '../config/config';
import { OpenAI, ClientOptions } from 'openai'; // Certifique-se de importar também ClientOptions

let openaiClient: OpenAI;

async function loadOpenAI() {
    const { OpenAI } = await import('openai');
    
    // Crie um objeto de opções do cliente
    const options: ClientOptions = {
        apiKey: config.openaiApiKey
        // Outras opções, se necessário
    };

    // Passe as opções para inicializar o cliente
    openaiClient = new OpenAI(options);
}

loadOpenAI().catch(console.error);

export { openaiClient };
