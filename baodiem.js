document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectButton = document.getElementById('connectBleButton');
    const disconnectButton = document.getElementById('disconnectBleButton');
    const loadConfigButton = document.getElementById('loadConfigButton');
    const sendButton = document.getElementById('sendButton');
    const bleStateContainer = document.getElementById('bleState');
    const configBlock = document.getElementById('configBlock');
    const sendState = document.getElementById('sendState');
    const configOutput = document.getElementById("configOutput");

    // BLE Constants
    const DEVICE_NAME = 'VIETMAP_HUD';
    const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
    const WRITE_CHAR_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
    const NOTIF_CHAR_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
    const DEVICE_INFO_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';
    const FIRMWARE_CHAR_UUID = '00002a26-0000-1000-8000-00805f9b34fb';

    // Global variables
    let bleServer;
    let writeCharacteristic;
    let isConnected = false;
    const textDecoder = new TextDecoder('utf-8');
    const textEncoder = new TextEncoder();

    function setBleState(message, stateClass) {
        bleStateContainer.textContent = message;
        bleStateContainer.className = stateClass;
    }

    function onDisconnected() {
        setBleState('Đã ngắt kết nối', 'error');
        isConnected = false;
        configBlock.style.display = 'none';
        connectButton.style.display = 'block';
        disconnectButton.style.display = 'none';
    }

    connectButton.addEventListener('click', async () => {
        if (!navigator.bluetooth) {
            setBleState('Trình duyệt không hỗ trợ Bluetooth!', 'error');
            return;
        }

        try {
            setBleState('Đang tìm thiết bị...', 'connecting');
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ name: DEVICE_NAME }],
                optionalServices: [SERVICE_UUID, DEVICE_INFO_SERVICE_UUID]
            });

            device.addEventListener('gattserverdisconnected', onDisconnected);
            setBleState('Đang kết nối...', 'connecting');
            bleServer = await device.gatt.connect();

            const infoService = await bleServer.getPrimaryService(DEVICE_INFO_SERVICE_UUID);
            const firmwareChar = await infoService.getCharacteristic(FIRMWARE_CHAR_UUID);
            const firmwareValue = await firmwareChar.readValue();
            const firmwareVersion = textDecoder.decode(firmwareValue);

            setBleState(`Đã kết nối (${firmwareVersion})`, 'connected');
            isConnected = true;
            configBlock.style.display = 'block';
            connectButton.style.display = 'none';
            disconnectButton.style.display = 'inline-block';

            const service = await bleServer.getPrimaryService(SERVICE_UUID);
            writeCharacteristic = await service.getCharacteristic(WRITE_CHAR_UUID);
            const notificationCharacteristic = await service.getCharacteristic(NOTIF_CHAR_UUID);

            await notificationCharacteristic.startNotifications();
            notificationCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);

            loadCurrentConfig();
            setupEventListeners();
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            setBleState('Kết nối thất bại!', 'error');
        }
    });
    
    disconnectButton.addEventListener('click', () => {
        if (bleServer && bleServer.connected) {
            bleServer.disconnect();
        }
    });

    function handleCharacteristicChange(event) {
        const value = textDecoder.decode(event.target.value);
        console.log('Dữ liệu nhận được:', value);
        if (value) {
            parseConfigToUI(value);
        }
    }

    async function loadCurrentConfig() {
        if (!isConnected || !writeCharacteristic) return;
        try {
            await writeCharacteristic.writeValueWithoutResponse(textEncoder.encode("LOAD"));
            showStatusMessage('Đang tải cấu hình từ thiết bị...', 'success');
        } catch (error) {
            console.error('Lỗi khi tải cấu hình:', error);
            showStatusMessage('Lỗi khi tải cấu hình!', 'error');
        }
    }

    function parseConfigToUI(configString) {
        configOutput.value = configString;
        configString.split(';').forEach(pair => {
            const [key, value] = pair.split('=');
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });
        showStatusMessage('Đã tải cấu hình thành công!', 'success');
    }

    function buildConfigFromUI() {
        const awake_duration = document.getElementById('awake_duration').value;
        const sleep_duration = document.getElementById('sleep_duration').value;
        const configString = `DTBK;awake_duration=${awake_duration};sleep_duration=${sleep_duration}`;
        configOutput.value = configString;
        return configString;
    }

    async function sendConfig() {
        if (!isConnected || !writeCharacteristic) {
            showStatusMessage('Chưa kết nối!', 'error');
            return;
        }
        const configString = buildConfigFromUI();
        try {
            await writeCharacteristic.writeValueWithoutResponse(textEncoder.encode(configString));
            showStatusMessage('Đã gửi cấu hình thành công!', 'success');
        } catch (error) {
            console.error('Lỗi khi gửi cấu hình:', error);
            showStatusMessage('Gửi cấu hình thất bại!', 'error');
        }
    }

    function showStatusMessage(message, className) {
        sendState.textContent = message;
        sendState.className = `status-message ${className}`;
        setTimeout(() => {
            sendState.textContent = '';
            sendState.className = 'status-message';
        }, 3000);
    }
    
    function setupEventListeners() {
        loadConfigButton.addEventListener('click', loadCurrentConfig);
        sendButton.addEventListener('click', sendConfig);
    }
});