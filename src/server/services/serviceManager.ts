import { BaseService } from './baseService';
import { DiscoveryService } from './discoveryService';
import { FileService } from './fileService';
import { HttpService } from './httpService';

export class ServiceManager {
    private services: BaseService[];

    constructor() {
        const fileService = new FileService();
        const httpService = new HttpService(fileService);
        const discoveryService = new DiscoveryService();

        this.services = [
            fileService,
            httpService,
            discoveryService
        ];
    }

    async start() {
        for (const service of this.services) {
            await service.start();
        }
    }

    async stop() {
        for (const service of this.services.reverse()) {
            if (service.isStarted) {
                await service.stop();
            }
        }
    }
}