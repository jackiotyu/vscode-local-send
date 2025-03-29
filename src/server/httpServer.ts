import Fastify, { FastifyInstance } from 'fastify';
import { FileHandler } from './fileHandler';
import { RegisterInfo } from './types';

export class HttpServer {
    private app: FastifyInstance;

    constructor(private fileHandler: FileHandler) {
        this.app = Fastify({ logger: true });
        this.setupServer();
    }

    private setupServer() {
        this.setupContentParser();
        this.setupRoutes();
    }

    private setupContentParser() {
        this.app.addContentTypeParser('*', (req, payload, done) => {
            const chunks: Buffer[] = [];
            payload.on('data', chunk => chunks.push(chunk));
            payload.on('end', () => done(null, Buffer.concat(chunks)));
        });
    }

    private setupRoutes() {
        this.app.post('/api/localsend/v2/register', async (request) => {
            const body = request.body as RegisterInfo;
            console.log('Device registered:', body);
        });

        this.app.post('/api/localsend/v2/prepare-download', async (request) => {
            console.log('prepare-download', request.body);
        });

        this.app.post('/api/localsend/v2/prepare-upload', async (request) => {
            return this.fileHandler.prepareUpload(request.body as any);
        });

        this.app.post('/api/localsend/v2/upload', async (request, reply) => {
            const query = request.query as any;
            const contentType = request.headers['content-type'] || 'application/octet-stream';
            try {
                return await this.fileHandler.handleUpload(query, contentType, request.body as Buffer);
            } catch (error: any) {
                reply.status(500).send({ error: error.message });
            }
        });

        this.app.post('/api/localsend/v2/cancel', async (request) => {
            console.log('Transfer cancelled:', request.body);
            return { message: 'Transfer cancelled' };
        });

        this.app.get('/', () => ({ message: 'hello' }));
    }

    public async start(port: number) {
        await this.app.listen({ port, host: '0.0.0.0' });
    }

    public async stop() {
        await this.app.close();
    }
}