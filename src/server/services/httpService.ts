import Fastify, { FastifyInstance } from 'fastify';
import { BaseService } from './baseService';
import { FileService } from './fileService';
import { RegisterInfo } from '../types';
import { getDeviceConfig } from '../deviceConfig';
import { logger } from '../../utils/logger';

export class HttpService extends BaseService {
    private app: FastifyInstance;

    constructor(private fileService: FileService) {
        super();
        this.app = Fastify({ logger: false });
        this.setupServer();
    }

    private setupServer() {
        this.setupContentParser();
        this.setupRoutes();
    }

    private setupContentParser() {
        this.app.addContentTypeParser('*', (req, payload, done) => {
            const chunks: Buffer[] = [];
            payload.on('data', (chunk) => chunks.push(chunk));
            payload.on('end', () => done(null, Buffer.concat(chunks)));
        });
    }

    private setupRoutes() {
        this.app.post('/api/localsend/v2/register', async (request) => {
            const body = request.body as RegisterInfo;
            logger.info(`Device registered: ${JSON.stringify(body)}`);
        });

        this.app.post('/api/localsend/v2/prepare-download', async (request) => {
            logger.info(`prepare-download: ${JSON.stringify(request.body)}`);
        });

        this.app.post('/api/localsend/v2/prepare-upload', async (request) => {
            return this.fileService.prepareDownload(request.body as any);
        });

        this.app.post('/api/localsend/v2/upload', async (request, reply) => {
            const query = request.query as any;
            try {
                return await this.fileService.handleUpload(query, request.body as Buffer);
            } catch (error: any) {
                reply.status(500).send({ error: error.message });
            }
        });

        this.app.post('/api/localsend/v2/cancel', async (request) => {
            logger.info(`Transfer cancelled: ${JSON.stringify(request.body)}`);
            return { message: 'Transfer cancelled' };
        });
    }

    async start(): Promise<void> {
        const { port } = getDeviceConfig();
        await this.app.listen({ port, host: '0.0.0.0' });
        this._started = true;
    }

    async stop(): Promise<void> {
        await this.app.close();
        this._started = false;
    }
}