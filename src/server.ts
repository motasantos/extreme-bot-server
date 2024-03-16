import express, { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import RedisManager from './redis/RedisManager';
import AssistantCollection from './chat/AssistantCollection';
import {AssistantParams} from './interfaces/AssistantParams';

const app = express();
const port = 3000;

// Segurança básica com Helmet
app.use(helmet());

// Limitador de taxa de requisição
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 requisições por janela de tempo
});
app.use(limiter);

app.use(express.json());

const redisManager = new RedisManager();
const assistantCollection = new AssistantCollection(redisManager);

// Esquema de validação com Joi
const assistantSchema = Joi.object({
  name: Joi.string().required(),
  model: Joi.string().required(),
  instructions: Joi.string().required(),
  userInput: Joi.string().required(),
});

// Middleware de captura de erros assíncronos
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => any) => 
    (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);


    app.post('/assistants/:clientId/:assistantType', asyncHandler(async (req, res) => {
      try {
          const { clientId, assistantType } = req.params;
          const assistantParams: AssistantParams = req.body;
  
          // Verificar se o assistente já existe para este cliente
          const assistantId = await assistantCollection.createOrUpdateAssistant(clientId, assistantType, assistantParams);
  
          res.status(200).json({ assistantId });
      } catch (error) {
          console.error("Erro ao criar ou atualizar assistente:", error);
          res.status(500).send("Erro ao criar ou atualizar assistente");
      }
  }));
  

// Middleware global de tratamento de erros
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

app.listen(port, () => {
  console.log(`Servidor está ouvindo na porta ${port}`);
});
