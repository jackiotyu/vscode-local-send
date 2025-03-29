import * as vscode from 'vscode';
import { LocalSendServer } from './server/localSendServer';
import { getDeviceConfig } from './server/deviceConfig';
import { logger } from './utils/logger';

let localSendServer: LocalSendServer | null = null;

export function activate(context: vscode.ExtensionContext) {
    logger.info('LocalSend extension activated');
    const startServer = vscode.commands.registerCommand('vscode-local-send.startServer', () => {
        if (!localSendServer) {
            localSendServer = new LocalSendServer();
            localSendServer.start();
        } else {
            vscode.window.showInformationMessage('LocalSend server is already running');
        }
    });

    const stopServer = vscode.commands.registerCommand('vscode-local-send.stopServer', () => {
        if (localSendServer) {
            localSendServer.stop();
            localSendServer = null;
        } else {
            vscode.window.showInformationMessage('LocalSend server is not running');
        }
    });

    const openDownloadDir = vscode.commands.registerCommand('vscode-local-send.openDownloadDir', () => {
        vscode.env.openExternal(vscode.Uri.file(getDeviceConfig().downloadDir));
    });

    context.subscriptions.push(startServer, stopServer, openDownloadDir);
}

export function deactivate() {
    logger.info('LocalSend extension deactivated');
    if (localSendServer) {
        localSendServer.stop();
    }
}
