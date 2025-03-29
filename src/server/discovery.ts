import dgram from 'dgram';
import { MULTICAST_ADDR, PORT } from './config';
import { RegisterInfo } from './types';
import * as vscode from 'vscode';

export class DiscoveryService {
    private discoverySocket?: dgram.Socket;
    private messageBuffer: { [ip: string]: string } = {};
    private discoveredDevices: { [ip: string]: any } = {};
    private oldIds = new Set<string>();

    constructor(private deviceInfo: RegisterInfo) {}

    private checkDeviceChange(address: string, data: RegisterInfo) {
        if (this.oldIds.has(address)) {
            return;
        }
        this.oldIds.add(address);
        console.log(`Discovered device: ${data.alias} at ${address}`);
    }

    public start() {
        if (this.discoverySocket) {
            this.discoverySocket.close();
        }

        this.discoverySocket = dgram.createSocket({
            type: 'udp4',
            reuseAddr: true,
        });

        this.setupListeners();
        this.bindSocket();
    }

    private setupListeners() {
        if (!this.discoverySocket) return;

        this.discoverySocket.on('listening', () => {
            this.discoverySocket!.setBroadcast(true);
            this.discoverySocket!.setMulticastTTL(128);
            this.discoverySocket!.addMembership(MULTICAST_ADDR);
            console.log(`UDP socket listening on ${MULTICAST_ADDR}:${PORT}`);
        });

        this.discoverySocket.on('message', this.handleMessage.bind(this));
        this.discoverySocket.on('error', this.handleError.bind(this));
    }

    private handleMessage(msg: Buffer, rinfo: dgram.RemoteInfo) {
        try {
            const ip = rinfo.address;
            const rawData = msg.toString();

            if (!this.messageBuffer[ip]) {
                this.messageBuffer[ip] = '';
            }

            this.messageBuffer[ip] += rawData;

            const data: RegisterInfo = JSON.parse(msg.toString());
            this.discoveredDevices[rinfo.address] = data;
            this.messageBuffer[ip] = '';
            this.checkDeviceChange(ip, data);
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    }

    private handleError(err: Error) {
        vscode.window.showErrorMessage(`[UDP] Error: ${err.message}`);
        console.error('UDP error:', err);
    }

    private bindSocket() {
        this.discoverySocket?.bind(PORT, () => {
            this.startBroadcast();
        });
    }

    private startBroadcast() {
        setInterval(() => {
            const message = JSON.stringify(this.deviceInfo);
            this.discoverySocket!.send(message, 0, message.length, PORT, MULTICAST_ADDR, (err) => {
                if (err) {
                    console.error('Send error:', err);
                }
            });
        }, 5000);
    }

    public stop() {
        this.discoverySocket?.close();
    }
}