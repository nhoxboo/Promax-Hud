document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectButton = document.getElementById('connectBleButton');
    const loadConfigButton = document.getElementById('loadConfigButton');
    const sendButton = document.getElementById('sendButton');
    const transferFileButton = document.getElementById('transfer-file-button');

    const bleStateContainer = document.getElementById('bleState');
    const configBlock = document.getElementById('configBlock');
    const sendState = document.getElementById('sendState');
    const percentLabel = document.getElementById('file-transfer-percent');
    const configOutput = document.getElementById("configOutput");

    // Update notification elements
    const updateNotification = document.getElementById('update-notification');
    const currentFirmwareSpan = document.getElementById('current-firmware');
    const latestFirmwareSpan = document.getElementById('latest-firmware');


    // BLE Constants
    const DEVICE_NAME = 'VIETMAP_HUD';
    const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
    const WRITE_CHAR_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
    const NOTIF_CHAR_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
    const FILE_BLOCK_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';
    const DEVICE_INFO_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';
    const FIRMWARE_CHAR_UUID = '00002a26-0000-1000-8000-00805f9b34fb';

    // Global variables
    let bleServer;
    let writeCharacteristic;
    let fileBlockCharacteristic;
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
        updateNotification.style.display = 'none';
    }

    // Main connect function
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

            // Get device info and firmware version
            const infoService = await bleServer.getPrimaryService(DEVICE_INFO_SERVICE_UUID);
            const firmwareChar = await infoService.getCharacteristic(FIRMWARE_CHAR_UUID);
            const firmwareValue = await firmwareChar.readValue();
            const firmwareVersion = textDecoder.decode(firmwareValue);

            setBleState(`Đã kết nối (${firmwareVersion})`, 'connected');
            isConnected = true;
            configBlock.style.display = 'block';
            connectButton.style.display = 'none';

            // Check for firmware updates
            checkForUpdates(firmwareVersion);

            // Get service and characteristics
            const service = await bleServer.getPrimaryService(SERVICE_UUID);
            writeCharacteristic = await service.getCharacteristic(WRITE_CHAR_UUID);
            fileBlockCharacteristic = await service.getCharacteristic(FILE_BLOCK_UUID);
            const notificationCharacteristic = await service.getCharacteristic(NOTIF_CHAR_UUID);

            await notificationCharacteristic.startNotifications();
            notificationCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);

            // Automatically load current config on connect
            loadCurrentConfig();
            setupEventListeners();

        } catch (error) {
            console.error('Lỗi kết nối:', error);
            setBleState('Kết nối thất bại!', 'error');
        }
    });

    function handleCharacteristicChange(event) {
        const value = textDecoder.decode(event.target.value);
        console.log('Dữ liệu nhận được:', value);
        if (value) {
            parseConfigToUI(value);
        }
    }

    // Function to load config from device
    async function loadCurrentConfig() {
        if (!isConnected || !writeCharacteristic) {
            console.error('Chưa kết nối hoặc không tìm thấy characteristic');
            return;
        }
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
                if (key === 'led_color') {
                    element.value = `#${value.substring(2).padStart(6, '0')}`;
                } else {
                    element.value = value;
                }
            }
        });
        showStatusMessage('Đã tải cấu hình thành công!', 'success');
    }

    // Function to collect data from UI and build config string
    function buildConfigFromUI() {
        const config = {
            display_rotation: document.getElementById('display_rotation').value,
            show_clock: "1", // Hardcoded based on original logic
            led_color: document.getElementById('led_color').value.replace('#', '0x'),
            led_brightness: document.getElementById('led_brightness').value,
            logo_text: document.getElementById('logo_text').value,
            speed_limit_offset: document.getElementById('speed_limit_offset').value,
            welcome_text: document.getElementById('welcome_text').value,
            beep_limit_change: document.getElementById('beep_limit_change').value,
            show_text_kmh: "1", // Hardcoded
            show_number_marker: "1", // Hardcoded
            show_speed: "1", // Hardcoded
            obd_scan_duration: document.getElementById('obd_scan_duration').value,
            screen: document.getElementById('screen').value,
            boot_screen_duration: document.getElementById('boot_screen_duration').value,
            night_brightness: document.getElementById('night_brightness').value
        };

        const configString = `DTBK;display_rotation=${config.display_rotation};show_clock=${config.show_clock};led_color=${config.led_color};led_brightness=${config.led_brightness};logo_text=${config.logo_text};speed_limit_offset=${config.speed_limit_offset};welcome_text=${config.welcome_text};beep_limit_change=${config.beep_limit_change};show_text_kmh=${config.show_text_kmh};show_number_marker=${config.show_number_marker};show_speed=${config.show_speed};obd_scan_duration=${config.obd_scan_duration};screen=${config.screen};boot_screen_duration=${config.boot_screen_duration};night_brightness=${config.night_brightness}`;

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
    
    // File transfer logic
    async function transferFile(file) {
        if (!file) return;
        if (file.size > 100 * 1024) {
            alert('Kích thước file phải nhỏ hơn 100KB!');
            return;
        }

        percentLabel.style.display = 'block';
        percentLabel.textContent = '0%';
        
        const fileData = await file.arrayBuffer();
        const chunkSize = 128;
        let offset = 0;

        try {
            while (offset < fileData.byteLength) {
                const chunk = fileData.slice(offset, offset + chunkSize);
                await fileBlockCharacteristic.writeValueWithoutResponse(chunk);
                offset += chunk.byteLength;
                const percentComplete = Math.round((offset / fileData.byteLength) * 100);
                percentLabel.textContent = `${percentComplete}%`;
                await new Promise(resolve => setTimeout(resolve, 50)); // Delay to prevent buffer overflow
            }
             // Send "DTBK" to signal end of file transfer
            await fileBlockCharacteristic.writeValueWithoutResponse(textEncoder.encode("DTBK"));
            showStatusMessage('Upload ảnh thành công!', 'success');

        } catch(error) {
            console.error('Lỗi khi upload file:', error);
            showStatusMessage('Upload ảnh thất bại!', 'error');
        } finally {
            setTimeout(() => {
                percentLabel.style.display = 'none';
            }, 2000);
        }
    }
    
    // Check for firmware updates
    async function checkForUpdates(currentVersion) {
        try {
            // Assuming 'has_bl' is the default for checking
            const response = await fetch('./manifest_has_bl.json');
            const manifest = await response.json();
            const latestVersion = manifest.version;

            currentFirmwareSpan.textContent = currentVersion;
            latestFirmwareSpan.textContent = latestVersion;

            // Simple version comparison
            if (latestVersion > currentVersion) {
                updateNotification.style.display = 'block';
            }
        } catch (error) {
            console.error('Không thể kiểm tra cập nhật:', error);
        }
    }


    // Setup event listeners for UI elements
    function setupEventListeners() {
        loadConfigButton.addEventListener('click', loadCurrentConfig);
        sendButton.addEventListener('click', sendConfig);

        transferFileButton.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/jpeg';
            fileInput.onchange = (e) => transferFile(e.target.files[0]);
            fileInput.click();
        });
    }

});