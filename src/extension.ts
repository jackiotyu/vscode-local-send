import * as vscode from 'vscode';
import { LocalSendServer } from './server/localSendServer';

let localSendServer: LocalSendServer | null = null;

export function activate(context: vscode.ExtensionContext) {
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

    context.subscriptions.push(startServer, stopServer);
}

export function deactivate() {
    if (localSendServer) {
        localSendServer.stop();
    }
}
