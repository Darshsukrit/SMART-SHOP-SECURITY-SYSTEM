# Smart Shop Security System

> **A simple after-hours shop security monitoring and alarm system with a browser-based monitoring dashboard.**

---

## 📌 Project Overview

The **Smart Shop Security System** is a lightweight, responsive, browser-based security monitoring interface and hardware simulation engine designed for a small retail shop.

A central design principle of this project is the **strict architectural separation between surveillance monitoring and intrusion alarm triggering**:

* **CCTV Camera**: Operates continuously for 24/7 visual monitoring and video recording representation. Motion detected by the camera is logged for surveillance review but **NEVER** triggers the security alarm.
* **Magnetic Door Sensor**: Serves as the **primary perimeter alarm trigger**. After the 11:00 PM closing threshold, opening the protected shop door immediately activates the security alarm, sounds the local high-decibel siren, and dispatches a simulated mobile push alert to the shop owner.

---

## ⚙️ Security Logic & Decision Flow

```text
                    SHOP OPEN
                       │
                       ▼
                  NORMAL MODE
               (Before 11:00 PM)
                       │
                  11:00 PM
                       │
                       ▼
                AFTER-HOURS MODE
               (Armed Threshold)
                       │
                Door Sensor Armed
                       │
                ┌──────┴──────┐
                │             │
             CLOSED          OPEN
                │             │
             No Alarm       ALARM
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
             LOCAL SIREN (95 dB)   PHONE PUSH NOTIFICATION
             (Buzzer Active)       (Simulated Mobile Alert)
```

### Core Security Rules

1. **Normal Business Hours (Before 11:00 PM)**:
   * System is in `NORMAL` monitoring mode.
   * Customers and staff can open and close the front door freely.
   * Door state updates in real time, but the alarm remains `INACTIVE`.
2. **After-Hours Closing Mode (At / After 11:00 PM)**:
   * System transitions to `AFTER_HOURS` armed mode.
   * Protected entrance magnetic circuit is actively monitored.
   * If the door is opened $\rightarrow$ `ALARM ACTIVE` triggers instantly.
   * Local 5V piezo siren sounds (95 dB) and mobile notification packet is dispatched.
3. **CCTV Surveillance Isolation**:
   * CCTV feed remains active 24/7.
   * Motion events are displayed on the camera HUD and recorded in the event log.
   * CCTV motion does **NOT** trigger the alarm siren or send intrusion alerts.

---

## 🚀 Key Features

### 1. Security Dashboard
* **Real-Time Status Cards**: Live indicators for System Status (`ONLINE`), Security Mode (`NORMAL` / `AFTER_HOURS`), Door Status (`CLOSED` / `OPEN`), and Alarm Status (`INACTIVE` / `ACTIVE`).
* **Security Status Banner**: Dynamic header banner reflecting system posture (`✓ SYSTEM SECURE`, `🔒 AFTER-HOURS SECURITY ACTIVE`, or `🚨 SECURITY ALERT`).
* **Live Clock & Mode Indicator**: Header clock synchronizing with system time or simulated test time.
* **Smartphone Push Simulator**: Interactive preview card showing real-time mobile push notifications dispatched upon after-hours intrusion.
* **Recent Events Snapshot**: Real-time table of recent security events.

### 2. CCTV Monitoring Panel
* **Surveillance Viewport**: Visual shop interior representation with entrance overlay and scanlines.
* **HUD Overlay**: Camera ID (`CAM 01 — MAIN ENTRANCE`), live timestamp, stream status (`1080p @ 30 FPS`), and recording indicator.
* **Motion Simulation**: Interactive test button to demonstrate motion detection while confirming alarm isolation.

### 3. Door Security Panel
* **Animated Door Visualization**: Interactive visual door frame and leaf showing open/close state.
* **Magnetic Reed Contact Status**: Sensor LED indicator and magnetic continuity status (`CLOSED (CONTINUOUS)` vs `CIRCUIT BROKEN`).
* **Arming Condition Display**: Real-time display of door sensor arming threshold.

### 4. Hardware & Circuit Architecture
The Hardware page features two distinct visual modes powered by a single shared state engine:

* **System View (Logical Architecture)**:
  * Clean architectural component cards with directional signal-flow lines.
  * Shows logical data flow between Power, CCTV, Door Sensor, ESP32 Controller, Siren, Wi-Fi, and Phone Alert.
* **Circuit View (Physical Prototype / Breadboard Wiring)**:
  * Dark prototype bench / breadboard layout with physical module representations.
  * **ESP-WROOM-32 MCU Board**: Microcontroller PCB with RF shield, antenna trace, status LEDs, and pin labels (`GPIO 4`, `GPIO 18`, `VIN`, `GND`).
  * **Magnetic Reed Door Sensor**: Surface switch and actuator magnet block.
  * **Piezoelectric Siren**: Transducer module with vibrating pulse animation during alarm.
  * **Power Supply Adapter**: 5V DC regulated power supply module.
  * **Visible Color-Coded Wires**:
    * 🟢 **Green Wire**: Sensor signal line (Door Sensor `SIGNAL` $\rightarrow$ ESP32 `GPIO 4`).
    * 🟠 **Orange Wire**: +5V DC power bus (Power Supply $\rightarrow$ ESP32 `VIN` & Sensor `VCC`).
    * ⚫ **Black Wire**: Common Ground bus (`GND`).
    * 🔴 **Red Wire**: Alarm trigger wire (ESP32 `GPIO 18` $\rightarrow$ Buzzer `+`), dynamically flashing red during alarms.
    * 🔵 **Blue Wire**: Wi-Fi network RF bus and wireless push notification dispatch line.
    * 🟦 **Dashed Blue Cable**: Isolated CCTV video feed stream to recording hub.
* **Full-Width Component Inspector**:
  * Interactive selection of any hardware component.
  * 3-Column breakdown: **Live State & Electrical Readings**, **Technical Specifications**, and **System Role & Responsibilities**.
* **Simulated Hardware Status Table & Live Controls**:
  * Compact top-right sidebar with quick test triggers and subsystem online indicators.

### 5. Event Logging & Filtering
* **Chronological Security Log**: Timestamped record of every security event, door trigger, mode change, and alarm reset.
* **Category Filters**: Filter by `All Events`, `Alarm Triggers`, `Door Activity`, or `CCTV Motion`.
* **Local Persistence**: Events persist across page reloads via browser `localStorage`.

### 6. Interactive Hardware Simulation
Because physical microcontroller hardware is not directly wired to the browser, the interface includes a complete built-in simulation engine:
* **🚪 Door Open / Door Close**: Toggles the protected entrance state.
* **🌙 After-Hours**: Advances simulated time to 11:15 PM to arm the system.
* **☀️ Normal Hours**: Resets simulated time to 2:30 PM (daytime disarmed operation).
* **🔕 Reset Alarm**: Acknowledges and silences active sirens and clears alerts.
* **▶ Auto Flow Demo**: Runs an automated 15-second guided visual walkthrough demonstrating the entire hardware and security sequence.

---

## 🛠️ Technology Stack

* **Structure**: HTML5 (Semantic elements, SVG graphics, ARIA tags)
* **Styling**: Vanilla CSS3 (Custom design system, CSS Grid, Flexbox, glassmorphism, keyframe animations)
* **Logic & State Engine**: Vanilla JavaScript (ES6+, Single Source of Truth `systemState`, zero dependencies)
* **Typography**: Google Fonts (*Inter* & *JetBrains Mono*)

> **Note**: This project is built without external frontend frameworks (no React, Vue, Tailwind, or Bootstrap) and without backend/database servers (no Node.js, Express, Firebase, or MongoDB). It runs natively in any modern web browser.

---

## 📁 Repository Structure

```text
SMART-SHOP-SECURITY-SYSTEM/
│
├── index.html          # Main Single-Page Application (SPA) structure
├── style.css           # Complete design system, layouts & circuit board styling
├── script.js           # Central state model, security logic & hardware simulation
├── README.md           # Comprehensive project documentation
├── LICENSE             # MIT License
└── .gitignore          # Git ignore rules for clean repository maintenance
```

---

## 🖥️ How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Darshsukrit/SMART-SHOP-SECURITY-SYSTEM.git
   ```

2. **Navigate to the project directory**:
   ```bash
   cd SMART-SHOP-SECURITY-SYSTEM
   ```

3. **Open the application**:
   * Double-click `index.html` to open directly in your web browser (Chrome, Edge, Firefox, Safari).
   * Or open with a local live server (e.g., VS Code *Live Server* extension).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - feel free to use and modify it for educational and prototype purposes.
