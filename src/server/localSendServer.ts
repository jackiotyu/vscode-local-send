import * as vscode from 'vscode';
import { ServiceManager } from './services/serviceManager';
import { getDeviceConfig } from './deviceConfig';

export class LocalSendServer {
    private serviceManager: ServiceManager;
    private started: boolean = false;

    constructor() {
        this.serviceManager = new ServiceManager();
    }

    public async start() {
        if (this.started) {
            vscode.window.showInformationMessage('LocalSend server is already running');
            return;
        }

        try {
            await this.serviceManager.start();
            this.started = true;
            vscode.window.showInformationMessage(`LocalSend server started on ${getDeviceConfig().port}`);
        } catch (err) {
            if (err instanceof Error) {
                vscode.window.showErrorMessage(`Failed to start server: ${err.message}`);
            }
        }
    }

    public async stop() {
        if (!this.started) {
            vscode.window.showInformationMessage('LocalSend server is not started');
            return;
        }

        try {
            await this.serviceManager.stop();
            vscode.window.showInformationMessage('LocalSend server stopped');
        } catch (err) {
            if (err instanceof Error) {
                vscode.window.showErrorMessage(`Failed to stop server: ${err.message}`);
            }
        } finally {
            this.started = false;
        }
    }
}
