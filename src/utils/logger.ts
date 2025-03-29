import * as vscode from 'vscode';

class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('LocalSend');
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    info(message: string) {
        const time = new Date().toISOString();
        this.outputChannel.appendLine(`[INFO] ${time} ${message}`);
    }

    error(message: string, error?: Error) {
        const time = new Date().toISOString();
        this.outputChannel.appendLine(`[ERROR] ${time} ${message}`);
        if (error?.stack) {
            this.outputChannel.appendLine(error.stack);
        }
    }

    debug(message: string) {
        const time = new Date().toISOString();
        this.outputChannel.appendLine(`[DEBUG] ${time} ${message}`);
    }

    show() {
        this.outputChannel.show();
    }

    dispose() {
        this.outputChannel.dispose();
    }
}

export const logger = Logger.getInstance();