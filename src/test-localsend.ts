import * as dgram from 'dgram';
import axios from 'axios';
import * as https from 'https';

// 配置
const MULTICAST_ADDR = '224.0.0.167'; // LocalSend 的多播地址
const PORT = 53317; // LocalSend 默认端口
const DEVICE_NAME = 'VSCode'; // 自定义设备名称
const FINGERPRINT = 'absjkfsiofs';

// 创建 UDP 套接字用于设备发现
const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

// 设备列表
const discoveredDevices: { [ip: string]: any } = {};

// 设备信息
const deviceInfo = {
    alias: DEVICE_NAME,
    version: '2.0', // 协议版本（major.minor）
    deviceModel: DEVICE_NAME, // nullable
    deviceType: 'desktop', // mobile | desktop | web | headless | server, nullable
    fingerprint: FINGERPRINT,
    port: PORT,
    protocol: 'http', // http | https
    download: true, // 下载 API（5.2 和 5.3）是否激活（可选，默认为 false）
    announce: true,
};

// 启动 UDP 多播
function startDiscovery() {
    socket.on('listening', () => {
        socket.setBroadcast(true);
        socket.setMulticastTTL(128);
        socket.addMembership(MULTICAST_ADDR);
        console.log(`UDP socket listening on ${MULTICAST_ADDR}:${PORT}`);
    });

    const messageBuffer: { [ip: string]: string } = {};
    socket.on('message', (msg, rinfo) => {
        try {
            const ip = rinfo.address;
            const rawData = msg.toString();

            // 消息不完整
            if (!messageBuffer[ip]) {
                messageBuffer[ip] = '';
            }

            messageBuffer[ip] += rawData;

            // console.log('msg', msg.toString());
            const data = JSON.parse(msg.toString());
            // console.log(`Discovered device: ${data.name} at ${rinfo.address}:${rinfo.port}`);
            discoveredDevices[rinfo.address] = data;

            messageBuffer[ip] = '';
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });

    socket.on('error', (err) => {
        console.error('UDP error:', err);
    });

    socket.bind(PORT, () => {
        // 定期广播自己的信息
        setInterval(() => {
            const message = JSON.stringify(deviceInfo);
            socket.send(message, 0, message.length, PORT, MULTICAST_ADDR, (err) => {
                if (err) {
                    console.error('Send error:', err);
                }
            });
        }, 1000); // 每秒广播一次
    });
}

// 测试连接到某个设备
async function testConnection(targetIp: string) {
    const url = `https://${targetIp}:${PORT}/api/localsend/v2/register`; // LocalSend 的信息端点（假设）
    console.log(`Attempting to connect to ${url}`);

    try {
        const response = await axios.post(
            url,
            {
                alias: DEVICE_NAME,
                version: '2.0', // 协议版本（major.minor）
                deviceModel: DEVICE_NAME,
                deviceType: 'desktop',
                fingerprint: FINGERPRINT, // 在 HTTPS 模式下被忽略
                port: PORT,
                protocol: 'http', // http | https
                download: true, // 下载 API（5.2 和 5.3）是否激活（可选，默认为 false）
            },
            {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // 忽略自签名证书警告
                }),
                timeout: 5000,
            },
        );
        console.log('Connection successful, response:', response.data);
    } catch (error: any) {
        console.error('Connection failed:', error.message);
    }
}

// 主函数
function main() {
    console.log('Starting LocalSend test client...');
    startDiscovery();

    // 等待几秒后尝试连接发现的设备
    setTimeout(() => {
        const targetIp = Object.keys(discoveredDevices)[0];
        if (targetIp) {
            console.log(`Testing connection to ${targetIp}...`);
            testConnection(targetIp);
        } else {
            console.log('No devices discovered yet.');
        }
    }, 5000); // 5 秒后检查
}

// 运行
main();

// 清理
process.on('SIGINT', () => {
    socket.close();
    console.log('UDP socket closed.');
    process.exit();
});
