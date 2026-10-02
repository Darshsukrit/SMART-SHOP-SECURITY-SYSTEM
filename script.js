/**
 * ============================================================================
 * SMART SHOP SECURITY SYSTEM
 * Pure Vanilla JavaScript Application Logic & Hardware Simulation Engine
 * ============================================================================
 * 
 * CORE SECURITY RULE:
 * 1. BEFORE 11:00 PM (23:00) -> NORMAL MODE (Door disarmed, opening door does NOT trigger alarm)
 * 2. AT / AFTER 11:00 PM (23:00) -> AFTER_HOURS MODE (Protected door armed)
 *    - Door closed -> Alarm inactive
 *    - Door opened -> Alarm ACTIVATED + Push Notification sent + Buzzer sounds
 * 3. CCTV movement -> Monitored visually ONLY, NEVER triggers the alarm
 * 4. ONE SOURCE OF TRUTH -> Single systemState drives Dashboard, Hardware, and Event logs
 * 5. TWO DISTINCT HARDWARE VIEWS:
 *    - SYSTEM VIEW: Clean logical software architecture blocks & signal flow
 *    - CIRCUIT VIEW: Physical prototype bench / breadboard wiring with real pinouts & visible wires
 * ============================================================================
 */

(function () {
    "use strict";

    // ------------------------------------------------------------------------
    // 1. STATE MODEL (SINGLE SOURCE OF TRUTH)
    // ------------------------------------------------------------------------
    const CLOSING_HOUR = 23; // 11:00 PM in 24-hour time

    const systemState = {
        // Time & Clock Configuration
        clockMode: "LIVE",            // "LIVE" | "SIMULATED"
        simulatedDate: new Date(),    // Holds simulated time when clockMode is "SIMULATED"
        
        // Security Subsystem States (Shared across all tabs)
        systemStatus: "ONLINE",       // "ONLINE" | "OFFLINE"
        securityMode: "NORMAL",       // "NORMAL" (before 11 PM) | "AFTER_HOURS" (at/after 11 PM)
        doorStatus: "CLOSED",         // "CLOSED" | "OPEN"
        alarmStatus: "INACTIVE",      // "INACTIVE" | "ACTIVE"
        cctvStatus: "ONLINE",         // "ONLINE"
        cctvMotionActive: false,      // Boolean flag for temporary motion highlight
        
        // Hardware Visualization Specific State
        selectedHwComponent: "esp32", // Currently inspected hardware module
        hwViewMode: "system",         // "system" | "circuit"
        autoFlowRunning: false,       // Auto-flow demonstration flag
        
        // Timestamps & Active Alerts
        lastDoorEvent: null,
        activeNotification: null
    };

    // Events and Notifications data lists
    let events = [];

    // LocalStorage Keys
    const STORAGE_EVENTS_KEY = "smart_shop_security_events_log";

    // ------------------------------------------------------------------------
    // 2. DOM ELEMENT REFERENCES
    // ------------------------------------------------------------------------
    const elements = {
        // Navigation & Layout
        sidebarNav: document.getElementById("appSidebar"),
        sidebarBackdrop: document.getElementById("sidebarBackdrop"),
        mobileMenuBtn: document.getElementById("mobileMenuBtn"),
        navButtons: document.querySelectorAll(".nav-item"),
        contentSections: document.querySelectorAll(".content-section"),
        sidebarEventBadge: document.getElementById("sidebarEventBadge"),

        // Header Elements
        headerSystemStatus: document.getElementById("headerSystemStatus"),
        headerTime: document.getElementById("headerTime"),
        headerDate: document.getElementById("headerDate"),
        simModeText: document.getElementById("simModeText"),
        clockSourceDisplay: document.getElementById("clockSourceDisplay"),

        // Dashboard Core Cards & Banners
        mainSecurityBanner: document.getElementById("mainSecurityBanner"),
        bannerIcon: document.getElementById("bannerIcon"),
        bannerTitle: document.getElementById("bannerTitle"),
        bannerDesc: document.getElementById("bannerDesc"),
        bannerActionArea: document.getElementById("bannerActionArea"),
        bannerResetBtn: document.getElementById("bannerResetBtn"),
        quickAlarmBanner: document.getElementById("quickAlarmBanner"),
        quickAlarmText: document.getElementById("quickAlarmText"),

        cardSystemVal: document.getElementById("cardSystemVal"),
        cardSystemSubtext: document.getElementById("cardSystemSubtext"),
        cardModeVal: document.getElementById("cardModeVal"),
        cardModeSubtext: document.getElementById("cardModeSubtext"),
        cardDoorVal: document.getElementById("cardDoorVal"),
        cardDoorSubtext: document.getElementById("cardDoorSubtext"),
        cardAlarmVal: document.getElementById("cardAlarmVal"),
        cardAlarmSubtext: document.getElementById("cardAlarmSubtext"),

        // Mini snapshot indicators
        miniDoorVal: document.getElementById("miniDoorVal"),
        miniArmingVal: document.getElementById("miniArmingVal"),
        miniCctvVal: document.getElementById("miniCctvVal"),
        miniLastDoorVal: document.getElementById("miniLastDoorVal"),

        // Phone Notification Simulation
        phoneIdleState: document.getElementById("phoneIdleState"),
        phoneAlertCard: document.getElementById("phoneAlertCard"),
        phoneNotifTime: document.getElementById("phoneNotifTime"),
        notifStatusBadge: document.getElementById("notifStatusBadge"),

        // Demo / Simulation Action Buttons
        btnSimDoorOpen: document.getElementById("btnSimDoorOpen"),
        btnSimDoorClose: document.getElementById("btnSimDoorClose"),
        btnSimAfterHours: document.getElementById("btnSimAfterHours"),
        btnSimNormalHours: document.getElementById("btnSimNormalHours"),
        btnSimCctvMotion: document.getElementById("btnSimCctvMotion"),
        btnResetAlarm: document.getElementById("btnResetAlarm"),
        btnResetToLiveClock: document.getElementById("btnResetToLiveClock"),

        // CCTV Tab Elements
        cctvHudClock: document.getElementById("cctvHudClock"),
        cctvMotionAlert: document.getElementById("cctvMotionAlert"),
        btnSimCctvMotionTab: document.getElementById("btnSimCctvMotionTab"),
        cctvDoorGraphicLeft: document.getElementById("cctvDoorGraphicLeft"),
        cctvDoorGraphicRight: document.getElementById("cctvDoorGraphicRight"),
        cctvSensorGraphic: document.getElementById("cctvSensorGraphic"),

        // Door Security Tab Elements
        doorSectionStatusVal: document.getElementById("doorSectionStatusVal"),
        doorSectionStatusSub: document.getElementById("doorSectionStatusSub"),
        doorSectionArmVal: document.getElementById("doorSectionArmVal"),
        doorLeaf: document.getElementById("doorLeaf"),
        sensorLed: document.getElementById("sensorLed"),
        doorCircuitStatusText: document.getElementById("doorCircuitStatusText"),
        doorArmingConditionText: document.getElementById("doorArmingConditionText"),
        doorLastEventText: document.getElementById("doorLastEventText"),
        btnSimDoorOpenSection: document.getElementById("btnSimDoorOpenSection"),
        btnSimDoorCloseSection: document.getElementById("btnSimDoorCloseSection"),

        // Hardware & Circuit Tab: View Controls & Containers
        btnHwSystemView: document.getElementById("btnHwSystemView"),
        btnHwCircuitView: document.getElementById("btnHwCircuitView"),
        btnHwAutoFlow: document.getElementById("btnHwAutoFlow"),
        btnHwResetView: document.getElementById("btnHwResetView"),
        hwCanvasContainer: document.getElementById("hwCanvasContainer"),
        hwSystemViewContainer: document.getElementById("hwSystemViewContainer"),
        hwCircuitViewContainer: document.getElementById("hwCircuitViewContainer"),
        hwCircuitViewport: document.getElementById("hwCircuitViewport"),
        hwCircuitCanvasInner: document.getElementById("hwCircuitCanvasInner"),
        btnCircuitZoomOut: document.getElementById("btnCircuitZoomOut"),
        btnCircuitZoomReset: document.getElementById("btnCircuitZoomReset"),
        btnCircuitZoomIn: document.getElementById("btnCircuitZoomIn"),
        circuitZoomLevelText: document.getElementById("circuitZoomLevelText"),
        hwBoardModeTitle: document.getElementById("hwBoardModeTitle"),
        hwFlowStateTag: document.getElementById("hwFlowStateTag"),
        hwCanvasLed: document.getElementById("hwCanvasLed"),

        // Hardware System View Elements
        sysLineDoorToEsp: document.getElementById("sysLineDoorToEsp"),
        sysLineEspToBuzzer: document.getElementById("sysLineEspToBuzzer"),
        sysLineEspToWifi: document.getElementById("sysLineEspToWifi"),
        sysLineWifiToPhone: document.getElementById("sysLineWifiToPhone"),
        sysPulseDoor: document.getElementById("sysPulseDoor"),
        sysPulseBuzzer: document.getElementById("sysPulseBuzzer"),
        sysPulseWifi: document.getElementById("sysPulseWifi"),
        sysPulsePhone: document.getElementById("sysPulsePhone"),
        sysNodeEsp32: document.getElementById("sysNodeEsp32"),
        sysNodeDoor: document.getElementById("sysNodeDoor"),
        sysNodeBuzzer: document.getElementById("sysNodeBuzzer"),
        sysNodeWifi: document.getElementById("sysNodeWifi"),
        sysNodePhone: document.getElementById("sysNodePhone"),
        sysNodeCctv: document.getElementById("sysNodeCctv"),
        sysNodePower: document.getElementById("sysNodePower"),
        sysBadgeEsp32: document.getElementById("sysBadgeEsp32"),
        sysBadgeDoor: document.getElementById("sysBadgeDoor"),
        sysBadgeBuzzer: document.getElementById("sysBadgeBuzzer"),
        sysBadgeWifi: document.getElementById("sysBadgeWifi"),
        sysBadgePhone: document.getElementById("sysBadgePhone"),
        sysLedEsp32: document.getElementById("sysLedEsp32"),
        sysLedDoor: document.getElementById("sysLedDoor"),
        sysLedBuzzer: document.getElementById("sysLedBuzzer"),
        sysLedWifi: document.getElementById("sysLedWifi"),
        sysLedPhone: document.getElementById("sysLedPhone"),
        sysLedCctv: document.getElementById("sysLedCctv"),
        sysLedPower: document.getElementById("sysLedPower"),

        // Hardware Circuit View Physical Elements
        wirePhysicalSensor: document.getElementById("wirePhysicalSensor"),
        wirePhysicalAlarm: document.getElementById("wirePhysicalAlarm"),
        wirePhysicalWifi: document.getElementById("wirePhysicalWifi"),
        wirePhysicalPhone: document.getElementById("wirePhysicalPhone"),
        wirePhysicalCctv: document.getElementById("wirePhysicalCctv"),
        physPulseSensor: document.getElementById("physPulseSensor"),
        physPulseBuzzerWire: document.getElementById("physPulseBuzzerWire"),
        physPulseWifiWire: document.getElementById("physPulseWifiWire"),
        physPulsePhoneWire: document.getElementById("physPulsePhoneWire"),
        physNodeEsp32: document.getElementById("physNodeEsp32"),
        physNodeDoor: document.getElementById("physNodeDoor"),
        physNodeBuzzer: document.getElementById("physNodeBuzzer"),
        physNodeWifi: document.getElementById("physNodeWifi"),
        physNodePhone: document.getElementById("physNodePhone"),
        physNodeCctv: document.getElementById("physNodeCctv"),
        physNodePower: document.getElementById("physNodePower"),
        physEspLed: document.getElementById("physEspLed"),
        physEspAlarmDot: document.getElementById("physEspAlarmDot"),
        physDoorSignalDot: document.getElementById("physDoorSignalDot"),
        physBuzzerCylinder: document.getElementById("physBuzzerCylinder"),
        physPhoneScreenText: document.getElementById("physPhoneScreenText"),

        // Bottom Inspector & Top-Right Summary Panel Elements
        hwInspectorCard: document.getElementById("hwInspectorCard"),
        hwInspectorTitle: document.getElementById("hwInspectorTitle"),
        hwInspectorTag: document.getElementById("hwInspectorTag"),
        hwInspectorContent: document.getElementById("hwInspectorContent"),

        hwStatusRowEsp: document.getElementById("hwStatusRowEsp"),
        hwStatusRowDoor: document.getElementById("hwStatusRowDoor"),
        hwStatusRowBuzzer: document.getElementById("hwStatusRowBuzzer"),
        hwStatusRowCctv: document.getElementById("hwStatusRowCctv"),
        hwStatusRowWifi: document.getElementById("hwStatusRowWifi"),
        hwStatusRowPhone: document.getElementById("hwStatusRowPhone"),
        hwStatusRowPower: document.getElementById("hwStatusRowPower"),

        // Quick Hardware Live Control Buttons
        hwBtnDoorOpen: document.getElementById("hwBtnDoorOpen"),
        hwBtnDoorClose: document.getElementById("hwBtnDoorClose"),
        hwBtnAfterHours: document.getElementById("hwBtnAfterHours"),
        hwBtnNormalHours: document.getElementById("hwBtnNormalHours"),
        hwBtnResetAlarm: document.getElementById("hwBtnResetAlarm"),

        // Event Log Table Bodies
        dashboardRecentEventsBody: document.getElementById("dashboardRecentEventsBody"),
        fullEventsBody: document.getElementById("fullEventsBody"),
        eventsCountInfo: document.getElementById("eventsCountInfo"),
        btnClearEvents: document.getElementById("btnClearEvents"),
        btnViewAllEvents: document.getElementById("btnViewAllEvents"),
        filterButtons: document.querySelectorAll(".filter-btn")
    };

    // ------------------------------------------------------------------------
    // 3. HARDWARE SPECIFICATIONS DATABASE (FOR FULL-WIDTH INSPECTOR)
    // ------------------------------------------------------------------------
    const hardwareComponentsData = {
        esp32: {
            title: "ESP-WROOM-32 Microcontroller",
            subtitle: "Central Security Controller & Logic Core",
            tag: "MCU CONTROLLER",
            specs: {
                "Architecture": "Dual-Core 32-bit Xtensa LX6 @ 240 MHz",
                "Operating Voltage": "3.3V DC (Internal LDO via 5V Vin pin)",
                "Door Input Pin": "GPIO 4 (Internal Pull-Up)",
                "Alarm Output Pin": "GPIO 18 (Digital Output to Siren)",
                "Network Connectivity": "2.4 GHz Wi-Fi (802.11 b/g/n)",
                "Flash Memory": "4MB SPI Flash"
            },
            responsibilities: [
                "Applies the automatic 11:00 PM closing security rule in software.",
                "Continuously polls binary digital input from magnetic door sensor (GPIO 4).",
                "Drives the local 5V piezo siren on after-hours unauthorized entry (GPIO 18).",
                "Formats and dispatches push notification packets via local Wi-Fi network."
            ],
            getLiveStatus: () => {
                const isAlarm = (systemState.alarmStatus === "ACTIVE");
                const isArmed = (systemState.securityMode === "AFTER_HOURS");
                return {
                    "Mode": isAlarm ? "CRITICAL ALARM PROCESSING" : (isArmed ? "ARMED (AFTER-HOURS)" : "NORMAL MONITORING"),
                    "GPIO 4 (Door In)": systemState.doorStatus === "OPEN" ? "LOGIC HIGH (3.3V - Circuit Broken)" : "LOGIC LOW (0V - Circuit Closed)",
                    "GPIO 18 (Buzzer Out)": isAlarm ? "LOGIC HIGH (3.3V - Buzzer Sounding)" : "LOGIC LOW (0V - Standby)",
                    "Power Rail": "5.04V DC Vin / 3.30V Core",
                    "CPU Heartbeat": "Healthy (Active 1000ms loop)"
                };
            }
        },
        door: {
            title: "Magnetic Reed Contact Sensor",
            subtitle: "Perimeter Intrusion Detection Sensor",
            tag: "DIGITAL INPUT SENSOR",
            specs: {
                "Sensor Type": "Surface-Mounted Magnetic Reed Switch",
                "Circuit Loop": "Normally Closed (NC) Loop",
                "Interfacing": "Direct connection to ESP32 GPIO 4",
                "Sensitivity Gap": "15mm - 20mm magnetic break distance",
                "Alarm Priority": "PRIMARY ALARM TRIGGER (Armed at/after 11 PM)",
                "Wiring Terminals": "VCC (5V), SIGNAL (GPIO 4), GND"
            },
            responsibilities: [
                "Monitors physical open/close state of the retail shop front entrance.",
                "Maintains closed electrical continuity when door magnet is aligned.",
                "Opens electrical contact immediately when door is pushed open.",
                "Triggers security alert ONLY when security mode is AFTER-HOURS."
            ],
            getLiveStatus: () => {
                const isDoorOpen = (systemState.doorStatus === "OPEN");
                const isArmed = (systemState.securityMode === "AFTER_HOURS");
                return {
                    "Physical State": isDoorOpen ? "OPEN (Magnet Separated)" : "CLOSED (Magnet Aligned)",
                    "Circuit Continuity": isDoorOpen ? "BROKEN (Open Circuit)" : "CONTINUOUS (Closed Loop)",
                    "Arming Schedule": isArmed ? "ARMED (Past 11:00 PM Closing)" : "DISARMED (Normal Business Hours)",
                    "Signal Output Line": isDoorOpen ? "3.3V (Trigger Level)" : "0.0V (Normal Level)",
                    "Last Event": systemState.lastDoorEvent || "None recorded"
                };
            }
        },
        buzzer: {
            title: "Piezoelectric Siren / Buzzer",
            subtitle: "Local Audible Deterrent Module",
            tag: "AUDIBLE ALARM OUTPUT",
            specs: {
                "Module Type": "Active 5V Piezoelectric Siren",
                "Sound Pressure": "95 dB @ 10 cm continuous resonant tone",
                "Control Interface": "NPN Transistor Switch driven by GPIO 18",
                "Operating Voltage": "5.0V DC Rail",
                "Wiring Leads": "+ Lead (GPIO 18), - Lead (Common GND)",
                "Trigger Condition": "Protected door opening after 11:00 PM"
            },
            responsibilities: [
                "Provides instantaneous high-decibel audible alarm on premises.",
                "Operates under strict software logic from the ESP32 controller.",
                "Remains silent during daytime normal door operations.",
                "Latches active during after-hours breach until operator reset."
            ],
            getLiveStatus: () => {
                const isAlarm = (systemState.alarmStatus === "ACTIVE");
                return {
                    "Siren Audio State": isAlarm ? "ACTIVE (SOUNDING 95 dB)" : "STANDBY (SILENT)",
                    "Control Line (GPIO 18)": isAlarm ? "LOGIC HIGH (3.3V Active Drive)" : "LOGIC LOW (0V)",
                    "Current Draw": isAlarm ? "45 mA (Active Siren)" : "0 mA (Idle Standby)",
                    "Physical Alert": isAlarm ? "Vibrating Alert Active" : "Normal"
                };
            }
        },
        wifi: {
            title: "Wi-Fi 802.11 b/g/n Network Module",
            subtitle: "Wireless Data & Notification Gateway",
            tag: "NETWORK INTERFACE",
            specs: {
                "Frequency": "2.4 GHz ISM Band (Channels 1-13)",
                "Tx Power": "+19.5 dBm at antenna port",
                "Network Protocol": "TCP/IP with Secure Push Dispatch",
                "Transmission Latency": "< 20ms to push notification broker",
                "Interface Type": "Built-in ESP32 PCB Radio Antenna"
            },
            responsibilities: [
                "Maintains persistent wireless link with local access point.",
                "Transmits real-time security alert packets when alarm is triggered.",
                "Provides connectivity for remote dashboard state updates."
            ],
            getLiveStatus: () => {
                const isAlarm = (systemState.alarmStatus === "ACTIVE");
                return {
                    "Wireless Link": "CONNECTED (SSID: Shop_Secure_Net)",
                    "Signal Strength": "-58 dBm (Strong)",
                    "Packet Dispatch Mode": isAlarm ? "DISPATCHING ALERT PACKET" : "IDLE HEARTBEAT",
                    "Gateway Latency": "12ms"
                };
            }
        },
        phone: {
            title: "Shop Owner Mobile Push Receiver",
            subtitle: "Remote Security Alert Endpoint",
            tag: "ALERT RECEIVER",
            specs: {
                "Endpoint Type": "Smartphone Push Notification Client",
                "Notification Priority": "CRITICAL / URGENT (High-priority alert)",
                "Payload Contents": "Timestamp, Zone 1 Door, Severity Level",
                "Sound Channel": "Loud Siren Chime",
                "Notification Status": systemState.alarmStatus === "ACTIVE" ? "ALERT SENT" : "STANDBY / READY"
            },
            responsibilities: [
                "Receives instant push notifications if after-hours intrusion occurs.",
                "Displays timestamp and alert banner on the owner's lock screen.",
                "Stores notification record for verification and police reporting."
            ],
            getLiveStatus: () => {
                const notif = systemState.activeNotification;
                return {
                    "Client State": notif ? "ALERT RECEIVED & DISPLAYED" : "CONNECTED & LISTENING",
                    "Last Dispatch Time": notif ? notif.time : "None",
                    "Alert Level": notif ? "🚨 CRITICAL INTRUSION DETECTED" : "NORMAL",
                    "Push Confirmation": notif ? "ACKNOWLEDGED (HTTP 200 OK)" : "READY"
                };
            }
        },
        cctv: {
            title: "1080p HD CCTV Surveillance Camera",
            subtitle: "Visual Surveillance & Recording System",
            tag: "VIDEO SURVEILLANCE",
            specs: {
                "Video Resolution": "1920 x 1080 (1080p) @ 30 FPS",
                "Field of View": "110° Wide-Angle Lens overlooking entrance",
                "Stream Protocol": "RTSP / ONVIF IP Stream to Local NVR",
                "Alarm Linkage": "DISCONNECTED (Surveillance & evidence only)",
                "Transmission Line": "Direct Coaxial/IP Cable to Storage Hub"
            },
            responsibilities: [
                "Provides continuous 24/7 video recording of the retail shop.",
                "Supplies visual evidence for post-event verification.",
                "Motion detection is monitored visually, NEVER triggers alarm."
            ],
            getLiveStatus: () => {
                return {
                    "Video Feed": "ONLINE (CAM 01 - MAIN ENTRANCE)",
                    "Motion State": systemState.cctvMotionActive ? "MOTION DETECTED (SECTOR 1)" : "CLEAR",
                    "Alarm Circuit Link": "ISOLATED BY DESIGN (No alarm output)",
                    "Storage Hub Link": "STREAMING TO LOCAL NVR (1080p)"
                };
            }
        },
        power: {
            title: "5V DC Regulated Power Supply",
            subtitle: "Main System Power Bus",
            tag: "POWER SUPPLY",
            specs: {
                "AC Input": "100 - 240V AC, 50/60 Hz",
                "DC Output": "5.0V DC Regulated @ 2.0A Maximum",
                "Protection": "Over-Voltage, Over-Current & Short-Circuit",
                "Power Rails": "5V Main Rail (Orange Wire) + Ground Bus (Black Wire)",
                "Terminals": "+5V VCC, GND (0V)"
            },
            responsibilities: [
                "Supplies stable 5V DC power to the ESP32 microcontroller.",
                "Powers the magnetic reed sensor circuit and local buzzer.",
                "Ensures continuous operation without power fluctuations."
            ],
            getLiveStatus: () => {
                return {
                    "Main Rail Voltage": "5.04V DC (Regulated & Stable)",
                    "Current Consumption": systemState.alarmStatus === "ACTIVE" ? "185 mA (Alarm Active)" : "92 mA (Normal)",
                    "Ground Potential": "0.00V (Common Ground Ref)",
                    "Supply Health": "NORMAL / CONTINUOUS"
                };
            }
        }
    };

    // ------------------------------------------------------------------------
    // 4. TIME AND CLOCK MANAGEMENT
    // ------------------------------------------------------------------------

    /**
     * Retrieves the current effective date/time based on mode (Live vs Simulated).
     * @returns {Date}
     */
    function getCurrentDateTime() {
        if (systemState.clockMode === "SIMULATED") {
            return new Date(systemState.simulatedDate);
        }
        return new Date();
    }

    /**
     * Formats a Date object into a readable 12-hour time string (e.g. "11:37:05 PM")
     * @param {Date} date 
     * @param {boolean} includeSeconds 
     * @returns {string}
     */
    function formatTime(date, includeSeconds = true) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12
        const hourStr = hours.toString().padStart(2, '0');

        if (includeSeconds) {
            return `${hourStr}:${minutes}:${seconds} ${ampm}`;
        }
        return `${hourStr}:${minutes} ${ampm}`;
    }

    /**
     * Formats a Date object into a date string (e.g. "Friday, Oct 2, 2026")
     * @param {Date} date 
     * @returns {string}
     */
    function formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }

    /**
     * Periodic clock update function (runs every 1000ms).
     */
    function updateClock() {
        // If simulated, advance simulated clock by 1 second each tick
        if (systemState.clockMode === "SIMULATED") {
            systemState.simulatedDate = new Date(systemState.simulatedDate.getTime() + 1000);
        }

        const now = getCurrentDateTime();

        // Update header clock displays
        if (elements.headerTime) elements.headerTime.textContent = formatTime(now, true);
        if (elements.headerDate) elements.headerDate.textContent = formatDate(now);
        if (elements.cctvHudClock) elements.cctvHudClock.textContent = formatTime(now, true);

        // Periodically verify security mode based on time
        updateSecurityMode();
    }

    // ------------------------------------------------------------------------
    // 5. CORE SECURITY LOGIC
    // ------------------------------------------------------------------------

    /**
     * Evaluates current hour and updates security mode:
     * - Before 23:00 (11:00 PM) -> NORMAL mode
     * - At or after 23:00 (11:00 PM) -> AFTER_HOURS mode
     */
    function updateSecurityMode() {
        const now = getCurrentDateTime();
        const currentHour = now.getHours();

        // Retail after-hours rule: 23:00 (11:00 PM) through early morning
        const isAfterHours = (currentHour >= CLOSING_HOUR || currentHour < 6);

        const previousMode = systemState.securityMode;
        systemState.securityMode = isAfterHours ? "AFTER_HOURS" : "NORMAL";

        // If mode transitioned automatically due to clock tick, create an event
        if (previousMode !== systemState.securityMode) {
            if (systemState.securityMode === "AFTER_HOURS") {
                createEvent("After-hours mode activated (Closing threshold 11:00 PM)", "System", "Armed");
            } else {
                createEvent("Normal operating hours resumed", "System", "Normal");
            }
        }

        updateDashboard();
    }

    /**
     * Checks door status and applies security rules:
     * - If AFTER_HOURS and door is OPEN -> Alarm triggers!
     * - If NORMAL and door is OPEN -> Alarm stays INACTIVE.
     */
    function checkDoorStatus() {
        if (systemState.doorStatus === "OPEN") {
            if (systemState.securityMode === "AFTER_HOURS") {
                triggerAlarm();
            }
        }
    }

    /**
     * Simulates opening the protected front shop door.
     */
    function openDoor() {
        if (systemState.doorStatus === "OPEN") {
            return;
        }

        systemState.doorStatus = "OPEN";
        const now = getCurrentDateTime();
        systemState.lastDoorEvent = formatTime(now, false);

        if (systemState.securityMode === "NORMAL") {
            // Normal hours door open event
            createEvent("Door opened during normal hours", "Door Sensor", "Normal");
        } else {
            // After-hours door open event -> CRITICAL ALARM
            createEvent("Protected door opened", "Door Sensor", "ALERT");
            triggerAlarm();
        }

        updateDashboard();
    }

    /**
     * Simulates closing the protected front shop door.
     */
    function closeDoor() {
        if (systemState.doorStatus === "CLOSED") {
            return;
        }

        systemState.doorStatus = "CLOSED";
        const now = getCurrentDateTime();
        systemState.lastDoorEvent = formatTime(now, false);

        createEvent("Door closed", "Door Sensor", "Secure");

        // NOTE: If alarm is currently active, it remains active until manual reset
        updateDashboard();
    }

    /**
     * Triggers the alarm state and generates notification event.
     */
    function triggerAlarm() {
        if (systemState.alarmStatus !== "ACTIVE") {
            systemState.alarmStatus = "ACTIVE";
            
            // Log alarm activation
            createEvent("Alarm activated", "Security System", "ACTIVE");
            
            // Dispatch phone push notification simulation
            sendNotification(
                "SHOP SECURITY ALERT",
                "Protected door opened after 11:00 PM.",
                "SENT"
            );
        }
    }

    /**
     * Resets the active alarm back to INACTIVE.
     * Retains all security events in history log.
     */
    function resetAlarm() {
        if (systemState.alarmStatus === "ACTIVE") {
            systemState.alarmStatus = "INACTIVE";
            systemState.activeNotification = null;

            createEvent("Alarm acknowledged and reset by operator", "Security System", "Normal");
            updateDashboard();
        }
    }

    /**
     * Simulates CCTV motion detection.
     * CRITICAL RULE: CCTV motion must NEVER trigger the alarm.
     */
    let motionTimeout = null;
    function simulateCCTVMotion() {
        systemState.cctvMotionActive = true;

        // Log motion monitoring event
        createEvent("CCTV motion detected at Main Entrance", "CCTV", "MONITORING");

        // Display visual motion overlay on camera view
        if (elements.cctvMotionAlert) {
            elements.cctvMotionAlert.style.display = "flex";
        }

        // Clear previous timeout if any
        if (motionTimeout) clearTimeout(motionTimeout);

        // Turn off visual motion badge after 3.5 seconds
        motionTimeout = setTimeout(() => {
            systemState.cctvMotionActive = false;
            if (elements.cctvMotionAlert) {
                elements.cctvMotionAlert.style.display = "none";
            }
        }, 3500);

        // Re-render dashboard (alarm remains strictly unchanged)
        updateDashboard();
    }

    /**
     * Dispatches simulated phone push notification.
     * @param {string} title 
     * @param {string} message 
     * @param {string} status 
     */
    function sendNotification(title, message, status) {
        const now = getCurrentDateTime();
        systemState.activeNotification = {
            title: title,
            message: message,
            time: formatTime(now, false),
            status: status
        };

        createEvent("Phone notification generated", "Notification", "SENT");
    }

    // ------------------------------------------------------------------------
    // 6. HARDWARE VISUALIZATION & INTERACTIVE INSPECTOR ENGINE
    // ------------------------------------------------------------------------

    /**
     * Updates both the System View (Logical Architecture) and Circuit View (Physical Breadboard Wiring).
     */
    function updateHardwareSection() {
        const isAlarm = (systemState.alarmStatus === "ACTIVE");
        const isAfterHours = (systemState.securityMode === "AFTER_HOURS");
        const isDoorOpen = (systemState.doorStatus === "OPEN");

        // 1. Board Header Status Banner
        if (elements.hwFlowStateTag && elements.hwCanvasLed) {
            if (isAlarm) {
                elements.hwFlowStateTag.textContent = "STATE: ALARM ACTIVE (CRITICAL)";
                elements.hwFlowStateTag.className = "hw-tag tag-red";
                elements.hwCanvasLed.className = "hw-chip-led alert";
            } else if (isAfterHours) {
                elements.hwFlowStateTag.textContent = "STATE: ARMED (AFTER-HOURS)";
                elements.hwFlowStateTag.className = "hw-tag tag-amber";
                elements.hwCanvasLed.className = "hw-chip-led";
            } else {
                elements.hwFlowStateTag.textContent = "STATE: NORMAL MONITORING";
                elements.hwFlowStateTag.className = "hw-tag";
                elements.hwCanvasLed.className = "hw-chip-led";
            }
        }

        // ==========================================
        // 2. SYNCHRONIZE SYSTEM VIEW (LOGICAL ARCHITECTURE)
        // ==========================================
        renderSystemArchitecture();

        // ==========================================
        // 3. SYNCHRONIZE CIRCUIT VIEW (PHYSICAL BENCH PROTOTYPE)
        // ==========================================
        renderCircuitDiagram();

        // ==========================================
        // 4. TOP-RIGHT SIMULATED HARDWARE STATUS TABLE
        // ==========================================
        if (elements.hwStatusRowEsp) {
            elements.hwStatusRowEsp.textContent = isAlarm ? "● ALERT PROCESSING" : "● ONLINE";
            elements.hwStatusRowEsp.className = isAlarm ? "hw-status-pill tag-red" : "hw-status-pill tag-green";
        }
        if (elements.hwStatusRowDoor) {
            elements.hwStatusRowDoor.textContent = isDoorOpen ? "● OPEN" : "● CONNECTED";
            elements.hwStatusRowDoor.className = isDoorOpen ? "hw-status-pill tag-red" : "hw-status-pill tag-green";
        }
        if (elements.hwStatusRowBuzzer) {
            elements.hwStatusRowBuzzer.textContent = isAlarm ? "● ACTIVE (SIREN)" : "● READY";
            elements.hwStatusRowBuzzer.className = isAlarm ? "hw-status-pill tag-red" : "hw-status-pill tag-gray";
        }
        if (elements.hwStatusRowPhone) {
            elements.hwStatusRowPhone.textContent = isAlarm ? "● ALERT DISPATCHED" : "● READY";
            elements.hwStatusRowPhone.className = isAlarm ? "hw-status-pill tag-red" : "hw-status-pill tag-green";
        }

        // ==========================================
        // 5. BOTTOM FULL-WIDTH INSPECTOR CARD
        // ==========================================
        renderHardwareInspector(systemState.selectedHwComponent);
    }

    /**
     * Renders System View (Logical Architecture & Signal Flow)
     */
    function renderSystemArchitecture() {
        const isAlarm = (systemState.alarmStatus === "ACTIVE");
        const isAfterHours = (systemState.securityMode === "AFTER_HOURS");
        const isDoorOpen = (systemState.doorStatus === "OPEN");

        if (elements.sysNodeEsp32 && elements.sysBadgeEsp32 && elements.sysLedEsp32) {
            if (isAlarm) {
                elements.sysNodeEsp32.classList.add("alert-active");
                elements.sysBadgeEsp32.textContent = "ALARM PROCESSING";
                elements.sysBadgeEsp32.className = "sys-block-badge tag-red";
                elements.sysLedEsp32.className = "hw-node-status-led alert";
            } else if (isAfterHours) {
                elements.sysNodeEsp32.classList.remove("alert-active");
                elements.sysBadgeEsp32.textContent = "ARMED (AFTER-HOURS)";
                elements.sysBadgeEsp32.className = "sys-block-badge tag-amber";
                elements.sysLedEsp32.className = "hw-node-status-led";
            } else {
                elements.sysNodeEsp32.classList.remove("alert-active");
                elements.sysBadgeEsp32.textContent = isDoorOpen ? "DOOR OPEN (NORMAL)" : "MONITORING MODE";
                elements.sysBadgeEsp32.className = "sys-block-badge tag-green";
                elements.sysLedEsp32.className = "hw-node-status-led";
            }
        }

        if (elements.sysNodeDoor && elements.sysBadgeDoor && elements.sysLedDoor) {
            if (isDoorOpen) {
                elements.sysBadgeDoor.textContent = isAfterHours ? "OPEN (INTRUSION TRIGGER)" : "OPEN (NORMAL)";
                elements.sysBadgeDoor.className = isAfterHours ? "sys-block-badge tag-red" : "sys-block-badge tag-amber";
                elements.sysLedDoor.className = isAfterHours ? "hw-node-status-led alert" : "hw-node-status-led";
            } else {
                elements.sysBadgeDoor.textContent = isAfterHours ? "ARMED (CLOSED)" : "PRIMARY ALARM TRIGGER";
                elements.sysBadgeDoor.className = "sys-block-badge tag-green";
                elements.sysLedDoor.className = "hw-node-status-led";
            }
        }

        if (elements.sysBadgeBuzzer && elements.sysLedBuzzer) {
            if (isAlarm) {
                elements.sysBadgeBuzzer.textContent = "ACTIVE (95 dB SIREN)";
                elements.sysBadgeBuzzer.className = "sys-block-badge tag-red";
                elements.sysLedBuzzer.className = "hw-node-status-led alert";
            } else {
                elements.sysBadgeBuzzer.textContent = "STANDBY";
                elements.sysBadgeBuzzer.className = "sys-block-badge tag-gray";
                elements.sysLedBuzzer.className = "hw-node-status-led standby";
            }
        }

        if (elements.sysBadgeWifi && elements.sysBadgePhone) {
            if (isAlarm) {
                elements.sysBadgeWifi.textContent = "DISPATCHING ALERT";
                elements.sysBadgeWifi.className = "sys-block-badge tag-red";
                elements.sysBadgePhone.textContent = "NOTIFICATION SENT";
                elements.sysBadgePhone.className = "sys-block-badge tag-red";
                if (elements.sysLedWifi) elements.sysLedWifi.className = "hw-node-status-led alert";
                if (elements.sysLedPhone) elements.sysLedPhone.className = "hw-node-status-led alert";
            } else {
                elements.sysBadgeWifi.textContent = "CONNECTED";
                elements.sysBadgeWifi.className = "sys-block-badge tag-blue";
                elements.sysBadgePhone.textContent = "READY";
                elements.sysBadgePhone.className = "sys-block-badge tag-green";
                if (elements.sysLedWifi) elements.sysLedWifi.className = "hw-node-status-led";
                if (elements.sysLedPhone) elements.sysLedPhone.className = "hw-node-status-led";
            }
        }

        // System view signal lines
        if (elements.sysLineDoorToEsp && elements.sysLineEspToBuzzer) {
            if (isAlarm) {
                elements.sysLineDoorToEsp.setAttribute("stroke", "#ef4444");
                elements.sysLineEspToBuzzer.setAttribute("stroke", "#ef4444");
                if (elements.sysPulseBuzzer) elements.sysPulseBuzzer.style.display = "block";
                if (elements.sysPulsePhone) elements.sysPulsePhone.style.display = "block";
            } else {
                elements.sysLineDoorToEsp.setAttribute("stroke", "#10b981");
                elements.sysLineEspToBuzzer.setAttribute("stroke", "#475569");
                if (elements.sysPulseBuzzer) elements.sysPulseBuzzer.style.display = "none";
                if (elements.sysPulsePhone) elements.sysPulsePhone.style.display = "none";
            }
        }
    }

    /**
     * Renders Circuit View (Physical Prototype & Breadboard Wiring)
     */
    function renderCircuitDiagram() {
        const isAlarm = (systemState.alarmStatus === "ACTIVE");
        const isAfterHours = (systemState.securityMode === "AFTER_HOURS");
        const isDoorOpen = (systemState.doorStatus === "OPEN");

        if (elements.physNodeEsp32 && elements.physEspLed) {
            if (isAlarm) {
                elements.physNodeEsp32.classList.add("alert-active");
                elements.physEspLed.style.backgroundColor = "#ef4444";
                if (elements.physEspAlarmDot) elements.physEspAlarmDot.style.boxShadow = "0 0 8px #ef4444";
            } else {
                elements.physNodeEsp32.classList.remove("alert-active");
                elements.physEspLed.style.backgroundColor = "#10b981";
                if (elements.physEspAlarmDot) elements.physEspAlarmDot.style.boxShadow = "none";
            }
        }

        if (elements.physNodeDoor && elements.physDoorSignalDot) {
            if (isDoorOpen) {
                elements.physDoorSignalDot.className = isAfterHours ? "phys-pin-dot pin-red" : "phys-pin-dot pin-orange";
            } else {
                elements.physDoorSignalDot.className = "phys-pin-dot pin-green";
            }
        }

        if (elements.physNodeBuzzer) {
            if (isAlarm) {
                elements.physNodeBuzzer.classList.add("alarm-pulsing");
            } else {
                elements.physNodeBuzzer.classList.remove("alarm-pulsing");
            }
        }

        if (elements.physPhoneScreenText) {
            elements.physPhoneScreenText.textContent = isAlarm ? "🚨 ALERT SENT" : "READY";
            elements.physPhoneScreenText.style.color = isAlarm ? "#ef4444" : "#34d399";
        }

        // Circuit view physical wires
        if (elements.wirePhysicalAlarm) {
            if (isAlarm) {
                elements.wirePhysicalAlarm.setAttribute("class", "phys-wire wire-red-active");
                if (elements.physPulseBuzzerWire) elements.physPulseBuzzerWire.style.display = "block";
                if (elements.physPulsePhoneWire) elements.physPulsePhoneWire.style.display = "block";
            } else {
                elements.wirePhysicalAlarm.setAttribute("class", "phys-wire wire-red-inactive");
                if (elements.physPulseBuzzerWire) elements.physPulseBuzzerWire.style.display = "none";
                if (elements.physPulsePhoneWire) elements.physPulsePhoneWire.style.display = "none";
            }
        }
    }

    /**
     * Renders detailed specification and live hardware metrics for the inspected component into the bottom full-width panel.
     * @param {string} compId 
     */
    function renderHardwareInspector(compId) {
        const comp = hardwareComponentsData[compId];
        if (!comp || !elements.hwInspectorContent) return;

        // Highlight selected node card in both System View and Circuit View
        document.querySelectorAll(".sys-block-card, .phys-module-card").forEach(node => {
            if (node.dataset.component === compId) {
                node.classList.add("selected");
            } else {
                node.classList.remove("selected");
            }
        });

        if (elements.hwInspectorTitle) elements.hwInspectorTitle.innerHTML = `🔍 ${escapeHtml(comp.title)}`;
        if (elements.hwInspectorTag) elements.hwInspectorTag.textContent = comp.tag;

        const liveMetrics = comp.getLiveStatus();

        let liveMetricsHtml = "";
        for (const [key, val] of Object.entries(liveMetrics)) {
            liveMetricsHtml += `<li><span>${escapeHtml(key)}</span><strong style="color:#38bdf8;">${escapeHtml(val)}</strong></li>`;
        }

        let specsHtml = "";
        for (const [key, val] of Object.entries(comp.specs)) {
            specsHtml += `<li><span>${escapeHtml(key)}</span><strong>${escapeHtml(val)}</strong></li>`;
        }

        let respHtml = comp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`).join("");

        elements.hwInspectorContent.innerHTML = `
            <div class="hw-info-3col-grid">
                <!-- Column 1: Live Hardware State -->
                <div class="hw-info-col">
                    <div class="hw-info-col-heading">LIVE STATE &amp; ELECTRICAL READINGS</div>
                    <ul class="hw-spec-list">
                        ${liveMetricsHtml}
                    </ul>
                </div>

                <!-- Column 2: Technical Specifications -->
                <div class="hw-info-col">
                    <div class="hw-info-col-heading">TECHNICAL SPECIFICATIONS</div>
                    <ul class="hw-spec-list">
                        ${specsHtml}
                    </ul>
                </div>

                <!-- Column 3: Role & Responsibilities -->
                <div class="hw-info-col">
                    <div class="hw-info-col-heading">SYSTEM ROLE &amp; RESPONSIBILITIES</div>
                    <ul class="hw-resp-list">
                        ${respHtml}
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Sets active hardware view mode (System View vs Circuit View)
     * @param {string} mode 
     */
    function setHardwareViewMode(mode) {
        systemState.hwViewMode = mode;
        if (elements.btnHwSystemView && elements.btnHwCircuitView && elements.hwSystemViewContainer && elements.hwCircuitViewContainer) {
            if (mode === "circuit") {
                elements.btnHwCircuitView.classList.add("active");
                elements.btnHwSystemView.classList.remove("active");
                elements.hwCircuitViewContainer.classList.add("active");
                elements.hwSystemViewContainer.classList.remove("active");
                if (elements.hwBoardModeTitle) {
                    elements.hwBoardModeTitle.innerHTML = "CIRCUIT &amp; BREADBOARD VIEW &bull; PHYSICAL PROTOTYPE WIRING";
                }
            } else {
                elements.btnHwSystemView.classList.add("active");
                elements.btnHwCircuitView.classList.remove("active");
                elements.hwSystemViewContainer.classList.add("active");
                elements.hwCircuitViewContainer.classList.remove("active");
                if (elements.hwBoardModeTitle) {
                    elements.hwBoardModeTitle.innerHTML = "SYSTEM ARCHITECTURE VIEW &bull; LOGICAL SIGNAL FLOW";
                }
            }
        }
        updateHardwareSection();
    }

    /**
     * Controls Circuit Workspace Zoom level (0.6x to 1.4x)
     */
    let currentCircuitZoom = 1.0;
    function setCircuitZoom(zoomLevel) {
        currentCircuitZoom = Math.min(Math.max(zoomLevel, 0.6), 1.4);
        const percent = Math.round(currentCircuitZoom * 100);
        if (elements.circuitZoomLevelText) {
            elements.circuitZoomLevelText.textContent = `${percent}%`;
        }
        if (elements.hwCircuitCanvasInner) {
            elements.hwCircuitCanvasInner.style.transform = `scale(${currentCircuitZoom})`;
            elements.hwCircuitCanvasInner.style.transformOrigin = "top left";
        }
    }

    function zoomInCircuit() {
        setCircuitZoom(currentCircuitZoom + 0.15);
    }

    function zoomOutCircuit() {
        setCircuitZoom(currentCircuitZoom - 0.15);
    }

    function resetCircuitZoom() {
        setCircuitZoom(1.0);
        if (elements.hwCircuitViewport) {
            elements.hwCircuitViewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
        }
    }

    /**
     * Runs an automated 15-second visual demonstration flow of the physical hardware & security sequence.
     */
    let autoFlowTimer = null;
    function startAutoFlowDemo() {
        if (systemState.autoFlowRunning) {
            stopAutoFlowDemo();
            return;
        }

        systemState.autoFlowRunning = true;
        if (elements.btnHwAutoFlow) {
            elements.btnHwAutoFlow.textContent = "⏹ Stop Auto Flow";
            elements.btnHwAutoFlow.classList.add("running");
        }

        createEvent("Started Automated Hardware Flow Demonstration", "System", "Normal");

        // Step 1: Power supply & Normal operating hours (0s)
        setSimulatedNormalHours();
        closeDoor();
        renderHardwareInspector("power");

        // Step 2: Transition to Door Sensor & ESP32 (3s)
        autoFlowTimer = setTimeout(() => {
            renderHardwareInspector("esp32");

            // Step 3: Switch to After-Hours (11:15 PM) -> Door becomes Armed (6s)
            autoFlowTimer = setTimeout(() => {
                setSimulatedAfterHours();
                renderHardwareInspector("door");

                // Step 4: Door Opens -> Critical Intrusion Trigger (9s)
                autoFlowTimer = setTimeout(() => {
                    openDoor();
                    renderHardwareInspector("esp32");

                    // Step 5: Buzzer Siren Sounds & Wi-Fi Dispatches Phone Alert (12s)
                    autoFlowTimer = setTimeout(() => {
                        renderHardwareInspector("phone");

                        // Step 6: Reset Alarm & Return to Normal (16s)
                        autoFlowTimer = setTimeout(() => {
                            resetAlarm();
                            closeDoor();
                            renderHardwareInspector("esp32");
                            stopAutoFlowDemo();
                        }, 4000);

                    }, 3500);

                }, 3500);

            }, 3000);

        }, 3000);
    }

    function stopAutoFlowDemo() {
        if (autoFlowTimer) clearTimeout(autoFlowTimer);
        systemState.autoFlowRunning = false;
        if (elements.btnHwAutoFlow) {
            elements.btnHwAutoFlow.textContent = "▶ Auto Flow Demo";
            elements.btnHwAutoFlow.classList.remove("running");
        }
    }

    // ------------------------------------------------------------------------
    // 7. EVENT LOGGING & LOCALSTORAGE PERSISTENCE
    // ------------------------------------------------------------------------

    /**
     * Creates and records a chronological event.
     * @param {string} eventName 
     * @param {string} source 
     * @param {string} status 
     */
    function createEvent(eventName, source, status) {
        const now = getCurrentDateTime();
        const eventItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            time: formatTime(now, false),
            rawTime: now.getTime(),
            event: eventName,
            source: source,
            status: status
        };

        // Add to beginning of array (newest first)
        events.unshift(eventItem);

        // Cap stored events at 100 to maintain optimal performance
        if (events.length > 100) {
            events.pop();
        }

        saveEventsToStorage();
        renderEventTables();
    }

    /**
     * Saves events array to localStorage.
     */
    function saveEventsToStorage() {
        try {
            localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
        } catch (e) {
            console.warn("LocalStorage access failed or disabled:", e);
        }
    }

    /**
     * Loads events array from localStorage or initializes default events.
     */
    function loadEventsFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_EVENTS_KEY);
            if (saved) {
                events = JSON.parse(saved);
            } else {
                seedInitialEvents();
            }
        } catch (e) {
            seedInitialEvents();
        }
    }

    /**
     * Seeds realistic initial events when starting fresh.
     */
    function seedInitialEvents() {
        const now = getCurrentDateTime();
        const timeMinus15 = new Date(now.getTime() - 15 * 60000);
        const timeMinus10 = new Date(now.getTime() - 10 * 60000);
        const timeMinus2 = new Date(now.getTime() - 2 * 60000);

        events = [
            {
                id: "e1",
                time: formatTime(timeMinus2, false),
                rawTime: timeMinus2.getTime(),
                event: "Door closed and magnetic circuit secure",
                source: "Door Sensor",
                status: "Secure"
            },
            {
                id: "e2",
                time: formatTime(timeMinus10, false),
                rawTime: timeMinus10.getTime(),
                event: "CCTV CAM-01 surveillance stream active",
                source: "CCTV",
                status: "MONITORING"
            },
            {
                id: "e3",
                time: formatTime(timeMinus15, false),
                rawTime: timeMinus15.getTime(),
                event: "System monitoring initialized",
                source: "System",
                status: "Normal"
            }
        ];
        saveEventsToStorage();
    }

    /**
     * Clears all recorded events from storage and array.
     */
    function clearEventLog() {
        events = [];
        saveEventsToStorage();
        createEvent("Security event log cleared by operator", "System", "Normal");
    }

    // ------------------------------------------------------------------------
    // 8. UI RENDERING & DOM SYNCHRONIZATION
    // ------------------------------------------------------------------------

    /**
     * Synchronizes all visual dashboard elements with systemState.
     */
    function updateDashboard() {
        const isAlarm = (systemState.alarmStatus === "ACTIVE");
        const isAfterHours = (systemState.securityMode === "AFTER_HOURS");
        const isDoorOpen = (systemState.doorStatus === "OPEN");

        // 1. Update Prominent Security Status Banner
        updateSecurityBanner(isAlarm, isAfterHours, isDoorOpen);

        // 2. Update Quick Header Alarm Pill
        if (elements.quickAlarmBanner && elements.quickAlarmText) {
            if (isAlarm) {
                elements.quickAlarmBanner.className = "quick-alarm-indicator alert-active";
                elements.quickAlarmText.textContent = "ALARM ACTIVE";
            } else {
                elements.quickAlarmBanner.className = "quick-alarm-indicator";
                elements.quickAlarmText.textContent = "ALARM INACTIVE";
            }
        }

        // 3. Update 4 Status Cards
        // Card 1: System Status
        if (elements.cardSystemVal) {
            elements.cardSystemVal.textContent = "● ONLINE";
            elements.cardSystemVal.className = "card-value status-val-online";
        }
        if (elements.cardSystemSubtext) {
            elements.cardSystemSubtext.textContent = "All monitored software components are operating.";
        }

        // Card 2: Security Mode
        if (elements.cardModeVal) {
            elements.cardModeVal.textContent = isAfterHours ? "AFTER HOURS" : "NORMAL";
            elements.cardModeVal.className = isAfterHours ? "card-value status-val-after-hours" : "card-value status-val-normal";
        }
        if (elements.cardModeSubtext) {
            elements.cardModeSubtext.textContent = isAfterHours
                ? "Arming active (Past 11:00 PM). Door open triggers alarm."
                : "Standard hours (Before 11:00 PM). Door sensor disarmed.";
        }

        // Card 3: Door Status
        if (elements.cardDoorVal) {
            elements.cardDoorVal.textContent = isDoorOpen ? "OPEN" : "CLOSED";
            elements.cardDoorVal.className = isDoorOpen ? "card-value status-val-open" : "card-value status-val-closed";
        }
        if (elements.cardDoorSubtext) {
            elements.cardDoorSubtext.textContent = isDoorOpen
                ? "Front entrance magnetic circuit broken."
                : "Protected front entrance sensor is secure.";
        }

        // Card 4: Alarm Status
        if (elements.cardAlarmVal) {
            elements.cardAlarmVal.textContent = isAlarm ? "ACTIVE" : "INACTIVE";
            elements.cardAlarmVal.className = isAlarm ? "card-value status-val-active" : "card-value status-val-inactive";
        }
        if (elements.cardAlarmSubtext) {
            elements.cardAlarmSubtext.textContent = isAlarm
                ? "Unauthorized door opening detected after hours!"
                : "No unauthorized intrusion detected.";
        }

        // 4. Update Simulation Tag & Clock Source
        if (elements.simModeText && elements.clockSourceDisplay) {
            if (systemState.clockMode === "SIMULATED") {
                const now = getCurrentDateTime();
                const timeLabel = isAfterHours ? "AFTER-HOURS (11:15 PM)" : "NORMAL (2:30 PM)";
                elements.simModeText.textContent = `SIM: ${timeLabel}`;
                elements.clockSourceDisplay.textContent = `Simulated (${formatTime(now, false)})`;
            } else {
                elements.simModeText.textContent = "LIVE TIME";
                elements.clockSourceDisplay.textContent = "Computer System Clock";
            }
        }

        // 5. Update Phone Notification Simulator
        updatePhoneNotificationPanel(isAlarm);

        // 6. Update Mini Snapshot Widget
        if (elements.miniDoorVal) elements.miniDoorVal.textContent = systemState.doorStatus;
        if (elements.miniArmingVal) elements.miniArmingVal.textContent = isAfterHours ? "ARMED (AFTER 11 PM)" : "NORMAL (< 11 PM)";
        if (elements.miniCctvVal) elements.miniCctvVal.textContent = "ONLINE (MONITORING)";
        if (elements.miniLastDoorVal) elements.miniLastDoorVal.textContent = systemState.lastDoorEvent || "None";

        // 7. Update Door Security Section Visuals
        updateDoorSectionVisuals(isDoorOpen, isAfterHours, isAlarm);

        // 8. Update CCTV Graphic overlay
        if (elements.cctvDoorGraphicLeft && elements.cctvDoorGraphicRight) {
            if (isDoorOpen) {
                elements.cctvDoorGraphicLeft.setAttribute("transform", "scale(0.3, 1)");
                elements.cctvDoorGraphicRight.setAttribute("transform", "translate(150, 0) scale(0.3, 1)");
            } else {
                elements.cctvDoorGraphicLeft.removeAttribute("transform");
                elements.cctvDoorGraphicRight.removeAttribute("transform");
            }
        }
        if (elements.cctvSensorGraphic) {
            elements.cctvSensorGraphic.setAttribute("fill", isAlarm ? "#ef4444" : "#10b981");
        }

        // 9. Update Hardware & Circuit Architecture Visualization (Both Views)
        updateHardwareSection();

        // 10. Update Event Badges and Tables
        if (elements.sidebarEventBadge) {
            elements.sidebarEventBadge.textContent = events.length;
        }
        renderEventTables();
    }

    /**
     * Updates the main Security Status Banner styling and text.
     */
    function updateSecurityBanner(isAlarm, isAfterHours, isDoorOpen) {
        if (!elements.mainSecurityBanner) return;

        if (isAlarm) {
            // ALARM ACTIVE STATE
            elements.mainSecurityBanner.className = "security-banner banner-alarm";
            if (elements.bannerIcon) {
                elements.bannerIcon.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
            }
            if (elements.bannerTitle) elements.bannerTitle.textContent = "⚠ SECURITY ALERT";
            if (elements.bannerDesc) elements.bannerDesc.textContent = "Protected door opened after 11:00 PM. Alarm activated & push notification dispatched.";
            if (elements.bannerActionArea) elements.bannerActionArea.style.display = "block";
        } else if (isAfterHours) {
            // AFTER-HOURS ARMED STATE
            elements.mainSecurityBanner.className = "security-banner banner-after-hours";
            if (elements.bannerIcon) {
                elements.bannerIcon.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
            }
            if (elements.bannerTitle) elements.bannerTitle.textContent = "🔒 AFTER-HOURS SECURITY ACTIVE";
            if (elements.bannerDesc) elements.bannerDesc.textContent = "Protected door is armed after 11:00 PM. Perimeter is currently secure.";
            if (elements.bannerActionArea) elements.bannerActionArea.style.display = "none";
        } else {
            // NORMAL OPERATING HOURS STATE
            elements.mainSecurityBanner.className = "security-banner banner-normal";
            if (elements.bannerIcon) {
                elements.bannerIcon.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            }
            if (elements.bannerTitle) elements.bannerTitle.textContent = "✓ SYSTEM SECURE";
            if (elements.bannerDesc) elements.bannerDesc.textContent = "Normal operating hours (< 11:00 PM). Door operates normally. No active security event.";
            if (elements.bannerActionArea) elements.bannerActionArea.style.display = "none";
        }
    }

    /**
     * Updates phone notification simulator card display.
     */
    function updatePhoneNotificationPanel(isAlarm) {
        if (isAlarm && systemState.activeNotification) {
            if (elements.phoneIdleState) elements.phoneIdleState.style.display = "none";
            if (elements.phoneAlertCard) elements.phoneAlertCard.style.display = "block";
            if (elements.phoneNotifTime) elements.phoneNotifTime.textContent = systemState.activeNotification.time;
            if (elements.notifStatusBadge) {
                elements.notifStatusBadge.textContent = "ALERT SENT";
                elements.notifStatusBadge.className = "notification-status-badge tag-red";
            }
        } else {
            if (elements.phoneIdleState) elements.phoneIdleState.style.display = "block";
            if (elements.phoneAlertCard) elements.phoneAlertCard.style.display = "none";
            if (elements.notifStatusBadge) {
                elements.notifStatusBadge.textContent = "READY";
                elements.notifStatusBadge.className = "notification-status-badge";
            }
        }
    }

    /**
     * Updates door visualization and magnetic reed switch diagram.
     */
    function updateDoorSectionVisuals(isDoorOpen, isAfterHours, isAlarm) {
        if (elements.doorSectionStatusVal) {
            elements.doorSectionStatusVal.textContent = isDoorOpen ? "OPEN" : "CLOSED";
            elements.doorSectionStatusVal.className = isDoorOpen ? "door-info-val text-red" : "door-info-val text-green";
        }
        if (elements.doorSectionStatusSub) {
            elements.doorSectionStatusSub.textContent = isDoorOpen ? "Magnetic contact separated" : "Magnetic contact connected";
        }
        if (elements.doorSectionArmVal) {
            elements.doorSectionArmVal.textContent = isAfterHours ? "ARMED (ACTIVE)" : "NORMAL (DISARMED)";
            elements.doorSectionArmVal.className = isAfterHours ? "door-info-val status-val-after-hours" : "door-info-val status-val-normal";
        }
        if (elements.doorLeaf) {
            if (isDoorOpen) {
                elements.doorLeaf.classList.add("open");
            } else {
                elements.doorLeaf.classList.remove("open");
            }
        }
        if (elements.sensorLed) {
            if (isDoorOpen) {
                elements.sensorLed.className = "sensor-led alert";
            } else {
                elements.sensorLed.className = "sensor-led";
            }
        }
        if (elements.doorCircuitStatusText) {
            if (isDoorOpen) {
                elements.doorCircuitStatusText.textContent = "CIRCUIT BROKEN (SEPARATED)";
                elements.doorCircuitStatusText.className = "text-red";
            } else {
                elements.doorCircuitStatusText.textContent = "CIRCUIT CLOSED (CONTINUOUS)";
                elements.doorCircuitStatusText.className = "text-green";
            }
        }
        if (elements.doorArmingConditionText) {
            if (isAfterHours) {
                elements.doorArmingConditionText.textContent = "AFTER-HOURS ARMED (OPEN TRIGGERS ALARM)";
                elements.doorArmingConditionText.className = "text-red";
            } else {
                elements.doorArmingConditionText.textContent = "NORMAL HOURS (NO ALARM ON OPEN)";
                elements.doorArmingConditionText.className = "";
            }
        }
        if (elements.doorLastEventText) {
            elements.doorLastEventText.textContent = systemState.lastDoorEvent
                ? `${systemState.doorStatus} at ${systemState.lastDoorEvent}`
                : "None recorded";
        }
    }

    /**
     * Renders events into both the Dashboard recent table and full Event Log table.
     */
    let currentEventFilter = "all";

    function renderEventTables() {
        // 1. Render Dashboard Recent Events (Top 5)
        if (elements.dashboardRecentEventsBody) {
            const recent = events.slice(0, 5);
            if (recent.length === 0) {
                elements.dashboardRecentEventsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px;">No events recorded.</td></tr>`;
            } else {
                elements.dashboardRecentEventsBody.innerHTML = recent.map(ev => createEventRowHtml(ev)).join("");
            }
        }

        // 2. Render Full Events Table with Filter
        if (elements.fullEventsBody) {
            let filtered = events;
            if (currentEventFilter === "alarm") {
                filtered = events.filter(e => e.status === "ALERT" || e.status === "ACTIVE" || e.status === "SENT");
            } else if (currentEventFilter === "door") {
                filtered = events.filter(e => e.source === "Door Sensor");
            } else if (currentEventFilter === "cctv") {
                filtered = events.filter(e => e.source === "CCTV");
            }

            if (filtered.length === 0) {
                elements.fullEventsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:24px;">No matching events found for current filter.</td></tr>`;
            } else {
                elements.fullEventsBody.innerHTML = filtered.map(ev => createEventRowHtml(ev)).join("");
            }

            if (elements.eventsCountInfo) {
                elements.eventsCountInfo.textContent = `Showing ${filtered.length} of ${events.length} recorded events`;
            }
        }
    }

    /**
     * Helper to generate table row HTML with appropriate badge styling.
     */
    function createEventRowHtml(ev) {
        let badgeClass = "badge-normal";
        const statusLower = (ev.status || "").toLowerCase();

        if (statusLower === "secure" || statusLower === "normal") {
            badgeClass = "badge-normal";
        } else if (statusLower === "armed") {
            badgeClass = "badge-armed";
        } else if (statusLower === "alert" || statusLower === "active") {
            badgeClass = "badge-alert";
        } else if (statusLower === "sent") {
            badgeClass = "badge-sent";
        } else if (statusLower === "monitoring") {
            badgeClass = "badge-monitoring";
        }

        return `
            <tr>
                <td class="event-time-cell">${ev.time}</td>
                <td><strong>${escapeHtml(ev.event)}</strong></td>
                <td class="event-source-cell">${escapeHtml(ev.source)}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(ev.status)}</span></td>
            </tr>
        `;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ------------------------------------------------------------------------
    // 9. SIMULATION CONTROL HANDLERS
    // ------------------------------------------------------------------------

    /**
     * Sets clock to Normal Hours (2:30:00 PM).
     */
    function setSimulatedNormalHours() {
        const d = new Date();
        d.setHours(14, 30, 0, 0); // 2:30:00 PM
        systemState.simulatedDate = d;
        systemState.clockMode = "SIMULATED";

        createEvent("Simulated Normal Operating Hours (2:30 PM)", "System", "Normal");
        updateSecurityMode();
    }

    /**
     * Sets clock to After-Hours (11:15:00 PM / 23:15:00).
     */
    function setSimulatedAfterHours() {
        const d = new Date();
        d.setHours(23, 15, 0, 0); // 11:15:00 PM
        systemState.simulatedDate = d;
        systemState.clockMode = "SIMULATED";

        createEvent("Simulated After-Hours Mode (11:15 PM)", "System", "Armed");
        updateSecurityMode();
    }

    /**
     * Reverts clock back to live computer system time.
     */
    function resetToLiveClock() {
        systemState.clockMode = "LIVE";
        createEvent("Reverted clock source to live computer time", "System", "Normal");
        updateSecurityMode();
    }

    // ------------------------------------------------------------------------
    // 10. NAVIGATION AND SECTION SWITCHING
    // ------------------------------------------------------------------------

    function switchSection(targetSectionId) {
        // Update nav items
        elements.navButtons.forEach(btn => {
            if (btn.dataset.section === targetSectionId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Map section names to DOM section element IDs
        const sectionMap = {
            "dashboard": "sectionDashboard",
            "cctv": "sectionCctv",
            "door": "sectionDoor",
            "hardware": "sectionHardware",
            "events": "sectionEvents",
            "system": "sectionSystem"
        };

        const targetElId = sectionMap[targetSectionId] || "sectionDashboard";

        elements.contentSections.forEach(section => {
            if (section.id === targetElId) {
                section.classList.add("active");
            } else {
                section.classList.remove("active");
            }
        });

        // Close mobile sidebar if open
        closeMobileSidebar();
    }

    function openMobileSidebar() {
        if (elements.sidebarNav) elements.sidebarNav.classList.add("mobile-open");
        if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent background scroll when drawer is open
    }

    function closeMobileSidebar() {
        if (elements.sidebarNav) elements.sidebarNav.classList.remove("mobile-open");
        if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.remove("active");
        document.body.style.overflow = "";
    }

    // ------------------------------------------------------------------------
    // 11. EVENT LISTENERS SETUP
    // ------------------------------------------------------------------------

    function setupEventListeners() {
        // Navigation clicks
        elements.navButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.section;
                if (target) switchSection(target);
            });
        });

        // Mobile menu toggle & drawer backdrop
        if (elements.mobileMenuBtn) {
            elements.mobileMenuBtn.addEventListener("click", () => {
                if (elements.sidebarNav && elements.sidebarNav.classList.contains("mobile-open")) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            });
        }

        if (elements.sidebarBackdrop) {
            elements.sidebarBackdrop.addEventListener("click", closeMobileSidebar);
        }

        // Close mobile drawer on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" || e.key === "Esc") {
                closeMobileSidebar();
            }
        });

        // Dashboard quick link to full events log
        if (elements.btnViewAllEvents) {
            elements.btnViewAllEvents.addEventListener("click", () => {
                switchSection("events");
            });
        }

        // Demo Controls on Dashboard
        if (elements.btnSimDoorOpen) elements.btnSimDoorOpen.addEventListener("click", openDoor);
        if (elements.btnSimDoorClose) elements.btnSimDoorClose.addEventListener("click", closeDoor);
        if (elements.btnSimAfterHours) elements.btnSimAfterHours.addEventListener("click", setSimulatedAfterHours);
        if (elements.btnSimNormalHours) elements.btnSimNormalHours.addEventListener("click", setSimulatedNormalHours);
        if (elements.btnSimCctvMotion) elements.btnSimCctvMotion.addEventListener("click", simulateCCTVMotion);
        if (elements.btnResetAlarm) elements.btnResetAlarm.addEventListener("click", resetAlarm);
        if (elements.bannerResetBtn) elements.bannerResetBtn.addEventListener("click", resetAlarm);
        if (elements.btnResetToLiveClock) elements.btnResetToLiveClock.addEventListener("click", resetToLiveClock);

        // Section 2 CCTV Tab button
        if (elements.btnSimCctvMotionTab) elements.btnSimCctvMotionTab.addEventListener("click", simulateCCTVMotion);

        // Section 3 Door Security Tab buttons
        if (elements.btnSimDoorOpenSection) elements.btnSimDoorOpenSection.addEventListener("click", openDoor);
        if (elements.btnSimDoorCloseSection) elements.btnSimDoorCloseSection.addEventListener("click", closeDoor);

        // Section: Hardware & Circuit View Mode Switches & Actions
        if (elements.btnHwSystemView) {
            elements.btnHwSystemView.addEventListener("click", () => setHardwareViewMode("system"));
        }
        if (elements.btnHwCircuitView) {
            elements.btnHwCircuitView.addEventListener("click", () => setHardwareViewMode("circuit"));
        }
        if (elements.btnHwAutoFlow) {
            elements.btnHwAutoFlow.addEventListener("click", startAutoFlowDemo);
        }
        if (elements.btnHwResetView) {
            elements.btnHwResetView.addEventListener("click", () => {
                stopAutoFlowDemo();
                setHardwareViewMode("system");
                resetCircuitZoom();
                renderHardwareInspector("esp32");
            });
        }

        // Circuit Workspace Zoom Buttons
        if (elements.btnCircuitZoomIn) elements.btnCircuitZoomIn.addEventListener("click", zoomInCircuit);
        if (elements.btnCircuitZoomOut) elements.btnCircuitZoomOut.addEventListener("click", zoomOutCircuit);
        if (elements.btnCircuitZoomReset) elements.btnCircuitZoomReset.addEventListener("click", resetCircuitZoom);

        // Hardware Component Node Click Inspection (Both System View Blocks & Circuit View Physical Modules)
        document.querySelectorAll(".sys-block-card, .phys-module-card").forEach(nodeCard => {
            nodeCard.addEventListener("click", () => {
                const comp = nodeCard.dataset.component;
                if (comp) {
                    systemState.selectedHwComponent = comp;
                    renderHardwareInspector(comp);
                }
            });
        });

        // Quick Hardware Tab Controls
        if (elements.hwBtnDoorOpen) elements.hwBtnDoorOpen.addEventListener("click", openDoor);
        if (elements.hwBtnDoorClose) elements.hwBtnDoorClose.addEventListener("click", closeDoor);
        if (elements.hwBtnAfterHours) elements.hwBtnAfterHours.addEventListener("click", setSimulatedAfterHours);
        if (elements.hwBtnNormalHours) elements.hwBtnNormalHours.addEventListener("click", setSimulatedNormalHours);
        if (elements.hwBtnResetAlarm) elements.hwBtnResetAlarm.addEventListener("click", resetAlarm);

        // Section 4 Event Log Tab buttons & filters
        if (elements.btnClearEvents) elements.btnClearEvents.addEventListener("click", clearEventLog);

        elements.filterButtons.forEach(fBtn => {
            fBtn.addEventListener("click", () => {
                elements.filterButtons.forEach(b => b.classList.remove("active"));
                fBtn.classList.add("active");
                currentEventFilter = fBtn.dataset.filter || "all";
                renderEventTables();
            });
        });
    }

    // ------------------------------------------------------------------------
    // 12. INITIALIZATION
    // ------------------------------------------------------------------------

    function init() {
        // Load stored events or seeds
        loadEventsFromStorage();

        // Bind interactive event listeners
        setupEventListeners();

        // Initial clock & security mode evaluation
        updateClock();
        updateSecurityMode();

        // Initial Hardware View & Inspector render
        setHardwareViewMode("system");
        renderHardwareInspector(systemState.selectedHwComponent);

        // Start 1-second continuous tick
        setInterval(updateClock, 1000);
    }

    // Start application once DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
