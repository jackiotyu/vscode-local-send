import * as vscode from 'vscode';
import * as path from 'path';
import { PORT, DEVICE_NAME } from './config';
import { DiscoveryService } from './discovery';
import { FileHandler } from './fileHandler';
import { RegisterInfo } from './types';
import { HttpServer } from './httpServer';

export class LocalSendServer {
    private discoveryService: DiscoveryService;
    private fileHandler: FileHandler;
    private httpServer: HttpServer;
    private port: number;
    private deviceName: string;

    constructor() {
        this.port = vscode.workspace.getConfiguration('localSend').get('port', PORT);
        this.deviceName = vscode.workspace.getConfiguration('localSend').get('deviceName', DEVICE_NAME);
        this.fileHandler = new FileHandler(path.join(__dirname, 'uploads'));
        this.httpServer = new HttpServer(this.fileHandler);
        this.discoveryService = new DiscoveryService(this.deviceInfo);
    }

    private get fingerprint() {
        return `vscode-local-send:${this.port}`;
    }

    private get deviceInfo(): RegisterInfo {
        return {
            alias: this.deviceName,
            version: '2.0',
            deviceModel: this.deviceName,
            deviceType: 'desktop',
            fingerprint: this.fingerprint,
            port: this.port,
            protocol: 'http',
            download: true,
            announce: true,
        };
    }

    public async start() {
        try {
            await this.httpServer.start(this.port);
            this.discoveryService.start();
            vscode.window.showInformationMessage(`LocalSend server started on ${this.port}`);
        } catch (err) {
            if (err instanceof Error) {
                vscode.window.showErrorMessage(`Failed to start server: ${err.message}`);
            }
        }
    }

    public async stop() {
        await this.httpServer.stop();
        this.discoveryService.stop();
        vscode.window.showInformationMessage('LocalSend server stopped');
    }
}
