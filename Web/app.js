import {
    firestore,
    rtdb,
    VITRINA_CONFIG
} from "../firebase-config.js";

import {
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp as firestoreServerTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    ref,
    update,
    onValue,
    serverTimestamp as rtdbServerTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


// ======================================================
// CONFIGURACIÓN PRINCIPAL
// ======================================================

const GROUP_ID = "grupo_01";
const VITRINA_ID = "vitrinas_01";

// 5 minutos
const UNLOCK_DURATION_SECONDS = 5 * 60;


// ======================================================
// ESTADO GLOBAL
// ======================================================

const state = {
    groupId: GROUP_ID,
    vitrinaId: VITRINA_ID,

    currentToken: null,
    tokenCreatedAt: null,
    tokenExpiresAt: null,

    remainingSeconds: VITRINA_CONFIG.qrRefreshIntervalSecs,
    totalSeconds: VITRINA_CONFIG.qrRefreshIntervalSecs,

    timerInterval: null,

    isUnlocked: false,
    unlockedUser: null,

    unlockTimeout: null,
    unlockCountdownInterval: null,

    isConnected: false,

    lastEventTs: null,

    logs: []
};


// ======================================================
// REFERENCIA DE LA VITRINA EN FIRESTORE
// ======================================================

function getVitrinaFirestoreRef() {
    return doc(
        firestore,
        "grupo",
        state.groupId,
        "vitrinas",
        state.vitrinaId
    );
}


// ======================================================
// ELEMENTOS DEL DOM
// ======================================================

const DOM = {
    vitrinaIdEl: document.getElementById("vitrina-id-badge"),

    clockEl: document.getElementById("live-clock"),
    dateEl: document.getElementById("live-date"),

    connectionStatusEl:
        document.getElementById("connection-status"),

    statusBadgeEl:
        document.getElementById("vitrina-status-badge"),

    statusDotEl:
        document.getElementById("vitrina-status-dot"),

    statusTextEl:
        document.getElementById("vitrina-status-text"),

    qrWrapperEl:
        document.getElementById("qr-wrapper"),

    qrContainerEl:
        document.getElementById("qrcode-container"),

    unlockOverlayEl:
        document.getElementById("unlock-overlay"),

    unlockedUserNameEl:
        document.getElementById("unlocked-user-name"),

    unlockedTimeEl:
        document.getElementById("unlocked-timestamp"),

    timerProgressBarEl:
        document.getElementById("timer-progress-bar"),

    timerSecondsEl:
        document.getElementById("timer-seconds-text"),

    currentTokenPreviewEl:
        document.getElementById("current-token-preview"),

    lastSyncTimeEl:
        document.getElementById("last-sync-time"),

    eventLogsEl:
        document.getElementById("event-logs-list"),

    alertToastEl:
        document.getElementById("alert-toast"),

    alertToastTitleEl:
        document.getElementById("alert-toast-title"),

    alertToastMessageEl:
        document.getElementById("alert-toast-message"),

    btnSimulateUnlock:
        document.getElementById("btn-sim-unlock"),

    btnSimulateLock:
        document.getElementById("btn-sim-lock"),

    btnForceRefresh:
        document.getElementById("btn-force-refresh")
};


let qrCodeInstance = null;


// ======================================================
// AUDIO
// ======================================================

class SoundFX {

    constructor() {
        this.ctx = null;
    }

    init() {
        try {
            if (!this.ctx) {
                const AudioCtx =
                    window.AudioContext ||
                    window.webkitAudioContext;

                if (!AudioCtx) return;

                this.ctx = new AudioCtx();
            }

            if (this.ctx.state === "suspended") {
                this.ctx.resume();
            }

        } catch (error) {
            console.warn("Audio no disponible:", error);
        }
    }


    playUnlock() {

        try {

            this.init();

            if (!this.ctx) return;

            const now = this.ctx.currentTime;

            const osc1 =
                this.ctx.createOscillator();

            const osc2 =
                this.ctx.createOscillator();

            const gain =
                this.ctx.createGain();


            osc1.type = "sine";
            osc2.type = "triangle";


            osc1.frequency.setValueAtTime(
                587.33,
                now
            );

            osc1.frequency.exponentialRampToValueAtTime(
                880,
                now + 0.15
            );

            osc1.frequency.exponentialRampToValueAtTime(
                1174.66,
                now + 0.35
            );


            osc2.frequency.setValueAtTime(
                293.66,
                now
            );

            osc2.frequency.exponentialRampToValueAtTime(
                587.33,
                now + 0.35
            );


            gain.gain.setValueAtTime(
                0.01,
                now
            );

            gain.gain.linearRampToValueAtTime(
                0.3,
                now + 0.05
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + 0.8
            );


            osc1.connect(gain);
            osc2.connect(gain);

            gain.connect(
                this.ctx.destination
            );


            osc1.start(now);
            osc2.start(now);

            osc1.stop(now + 0.8);
            osc2.stop(now + 0.8);

        } catch (error) {

            console.warn(
                "No se pudo reproducir audio:",
                error
            );

        }
    }


    playTick() {

        try {

            this.init();

            if (!this.ctx) return;

            const now =
                this.ctx.currentTime;

            const osc =
                this.ctx.createOscillator();

            const gain =
                this.ctx.createGain();


            osc.type = "sine";

            osc.frequency.setValueAtTime(
                1200,
                now
            );

            osc.frequency.exponentialRampToValueAtTime(
                600,
                now + 0.03
            );


            gain.gain.setValueAtTime(
                0.03,
                now
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                now + 0.03
            );


            osc.connect(gain);

            gain.connect(
                this.ctx.destination
            );


            osc.start(now);

            osc.stop(
                now + 0.03
            );

        } catch (error) {
            // Ignorar
        }

    }


    playLock() {

        try {

            this.init();

            if (!this.ctx) return;

            const now =
                this.ctx.currentTime;

            const osc =
                this.ctx.createOscillator();

            const gain =
                this.ctx.createGain();


            osc.type = "sine";

            osc.frequency.setValueAtTime(
                440,
                now
            );

            osc.frequency.exponentialRampToValueAtTime(
                220,
                now + 0.3
            );


            gain.gain.setValueAtTime(
                0.2,
                now
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + 0.4
            );


            osc.connect(gain);

            gain.connect(
                this.ctx.destination
            );


            osc.start(now);

            osc.stop(
                now + 0.4
            );

        } catch (error) {
            // Ignorar
        }

    }

}


const audio = new SoundFX();


window.addEventListener(
    "click",
    () => audio.init(),
    { once: true }
);

window.addEventListener(
    "touchstart",
    () => audio.init(),
    { once: true }
);


// ======================================================
// GENERAR TOKEN CRIPTOGRÁFICO
// ======================================================

function generateSecureToken() {

    if (
        window.crypto &&
        window.crypto.randomUUID
    ) {

        return window.crypto.randomUUID();

    }


    const array =
        new Uint8Array(32);


    window.crypto.getRandomValues(
        array
    );


    return Array.from(
        array,
        byte =>
            byte
                .toString(16)
                .padStart(2, "0")
    ).join("");

}


// ======================================================
// GENERAR QR
// ======================================================

function renderQRCode(payloadString) {

    if (!DOM.qrContainerEl) {
        return;
    }


    DOM.qrContainerEl.innerHTML = "";


    qrCodeInstance =
        new QRCode(
            DOM.qrContainerEl,
            {
                text: payloadString,

                width: 256,
                height: 256,

                colorDark: "#0f172a",
                colorLight: "#ffffff",

                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );


    DOM.qrContainerEl
        .classList
        .remove("opacity-0");


    DOM.qrContainerEl
        .classList
        .add(
            "opacity-100",
            "transition-opacity",
            "duration-300"
        );

}


// ======================================================
// ROTACIÓN DEL QR
// ======================================================

async function rotateQRCode() {

    if (state.isUnlocked) {
        return;
    }


    const now =
        Date.now();


    const token =
        generateSecureToken();


    const expiresAt =
        now +
        (
            VITRINA_CONFIG
                .qrRefreshIntervalSecs *
            1000
        );


    state.currentToken =
        token;

    state.tokenCreatedAt =
        now;

    state.tokenExpiresAt =
        expiresAt;

    state.remainingSeconds =
        VITRINA_CONFIG
            .qrRefreshIntervalSecs;


    // --------------------------------------
    // CONTENIDO DEL QR
    // --------------------------------------

    const qrPayload = {

        type:
            "VITRINA_IOT_AUTH",

        groupId:
            state.groupId,

        vId:
            state.vitrinaId,

        token:
            token,

        ts:
            now,

        exp:
            expiresAt

    };


    const payloadString =
        JSON.stringify(
            qrPayload
        );


    // Mostrar QR

    renderQRCode(
        payloadString
    );


    // Mostrar token resumido

    if (
        DOM.currentTokenPreviewEl
    ) {

        DOM.currentTokenPreviewEl
            .textContent =
            `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;


        DOM.currentTokenPreviewEl
            .title =
            token;

    }


    // Sincronizar Firebase

    await syncTokenToFirebase(
        token,
        now,
        expiresAt
    );

}


// ======================================================
// SINCRONIZAR TOKEN CON FIRESTORE
// ======================================================

async function syncTokenToFirebase(
    token,
    createdAt,
    expiresAt
) {

    try {

        if (
            VITRINA_CONFIG.dbMode ===
            "firestore"
        ) {

            const vitrinaRef =
                getVitrinaFirestoreRef();


            await setDoc(
                vitrinaRef,
                {

                    activeToken:
                        token,

                    tokenCreatedAt:
                        Timestamp.fromMillis(
                            createdAt
                        ),

                    tokenExpiresAt:
                        Timestamp.fromMillis(
                            expiresAt
                        ),

                    lockState:
                        "LOCKED",

                    systemState:
                        "READY",

                    updatedAt:
                        firestoreServerTimestamp()

                },
                {
                    merge: true
                }
            );

        }

        else {

            // Compatibilidad RTDB

            const dbRef =
                ref(
                    rtdb,
                    `grupo/${state.groupId}/vitrinas/${state.vitrinaId}`
                );


            await update(
                dbRef,
                {

                    activeToken:
                        token,

                    tokenCreatedAt:
                        createdAt,

                    tokenExpiresAt:
                        expiresAt,

                    lockState:
                        "LOCKED",

                    systemState:
                        "READY",

                    updatedAt:
                        rtdbServerTimestamp()

                }
            );

        }


        setConnectionStatus(
            true
        );


        if (
            DOM.lastSyncTimeEl
        ) {

            DOM.lastSyncTimeEl
                .textContent =
                new Date()
                    .toLocaleTimeString();

        }

    }

    catch (error) {

        console.error(
            "Error sincronizando token:",
            error
        );


        setConnectionStatus(
            false
        );


        addLogEntry(
            "Error Firebase: " +
            error.message,
            "error"
        );

    }

}


// ======================================================
// ESCUCHAR FIRESTORE EN TIEMPO REAL
// ======================================================

function startFirebaseListener() {

    try {

        if (
            VITRINA_CONFIG.dbMode ===
            "firestore"
        ) {

            const vitrinaRef =
                getVitrinaFirestoreRef();


            onSnapshot(

                vitrinaRef,

                snapshot => {

                    setConnectionStatus(
                        true
                    );


                    if (
                        snapshot.exists()
                    ) {

                        handleRemoteDatabaseUpdate(
                            snapshot.data()
                        );

                    }

                    else {

                        console.warn(
                            "La vitrina no existe en Firestore."
                        );


                        addLogEntry(
                            "Documento de vitrina no encontrado",
                            "error"
                        );

                    }

                },

                error => {

                    console.error(
                        "Firestore Listener:",
                        error
                    );


                    setConnectionStatus(
                        false
                    );


                    addLogEntry(
                        "Conexión con Firestore perdida",
                        "error"
                    );

                }

            );

        }

        else {

            const dbRef =
                ref(
                    rtdb,
                    `grupo/${state.groupId}/vitrinas/${state.vitrinaId}`
                );


            onValue(

                dbRef,

                snapshot => {

                    setConnectionStatus(
                        true
                    );


                    if (
                        snapshot.exists()
                    ) {

                        handleRemoteDatabaseUpdate(
                            snapshot.val()
                        );

                    }

                },

                error => {

                    console.error(
                        "RTDB:",
                        error
                    );


                    setConnectionStatus(
                        false
                    );

                }

            );

        }

    }

    catch (error) {

        console.error(
            "Error iniciando listener:",
            error
        );


        setConnectionStatus(
            false
        );

    }

}


// ======================================================
// PROCESAR CAMBIOS REMOTOS
// ======================================================

function handleRemoteDatabaseUpdate(
    data
) {

    if (!data) {
        return;
    }


    const lockState =
        data.lockState;


    // --------------------------------------
    // DESBLOQUEADO
    // --------------------------------------

    if (
        lockState === "UNLOCKED" &&
        !state.isUnlocked
    ) {

        let user = {
            name:
                "Usuario Autorizado",

            uid:
                null
        };


        if (
            typeof data.unlockedBy ===
            "string"
        ) {

            user.name =
                data.unlockedBy;

        }

        else if (
            data.unlockedBy &&
            typeof data.unlockedBy ===
            "object"
        ) {

            user = {

                name:
                    data.unlockedBy.nombre ||
                    data.unlockedBy.name ||
                    "Usuario Autorizado",

                uid:
                    data.unlockedBy.uid ||
                    null

            };

        }


        // ----------------------------------
        // CALCULAR TIEMPO RESTANTE
        // ----------------------------------

        let durationSeconds =
            UNLOCK_DURATION_SECONDS;


        if (
            data.unlockExpiresAt
        ) {

            let expirationMs = null;


            if (
                typeof data.unlockExpiresAt
                    .toMillis ===
                "function"
            ) {

                expirationMs =
                    data.unlockExpiresAt
                        .toMillis();

            }

            else if (
                typeof data.unlockExpiresAt ===
                "number"
            ) {

                expirationMs =
                    data.unlockExpiresAt;

            }


            if (expirationMs) {

                durationSeconds =
                    Math.max(
                        1,
                        Math.ceil(
                            (
                                expirationMs -
                                Date.now()
                            ) /
                            1000
                        )
                    );

            }

        }


        handleUnlockEvent(
            user,
            durationSeconds
        );

    }


    // --------------------------------------
    // BLOQUEADO
    // --------------------------------------

    else if (
        lockState === "LOCKED" &&
        state.isUnlocked
    ) {

        handleLockEvent(
            "Bloqueo recibido desde Firebase",
            false
        );

    }


    // --------------------------------------
    // EVENTO
    // --------------------------------------

    if (
        data.lastEvent &&
        data.lastEvent.timestamp !==
        state.lastEventTs
    ) {

        state.lastEventTs =
            data.lastEvent.timestamp;


        addLogEntry(
            data.lastEvent.description ||
            `Evento: ${data.lastEvent.type}`,
            data.lastEvent.type ===
            "unlock"
                ? "success"
                : "info"
        );

    }

}


// ======================================================
// EVENTO DESBLOQUEO
// ======================================================

function handleUnlockEvent(
    user,
    durationSeconds =
        UNLOCK_DURATION_SECONDS
) {

    state.isUnlocked =
        true;

    state.unlockedUser =
        user;


    audio.playUnlock();


    updateSystemStatusUI(
        "unlocked",
        "Vitrina Desbloqueada"
    );


    // Ocultar QR

    if (
        DOM.qrWrapperEl
    ) {

        DOM.qrWrapperEl
            .classList
            .add("hidden");

    }


    // Mostrar overlay

    if (
        DOM.unlockOverlayEl
    ) {

        DOM.unlockOverlayEl
            .classList
            .remove("hidden");


        DOM.unlockOverlayEl
            .classList
            .add("flex");

    }


    // Nombre usuario

    const userName =
        typeof user === "string"
            ? user
            : (
                user.name ||
                user.nombre ||
                "Usuario Autorizado"
            );


    if (
        DOM.unlockedUserNameEl
    ) {

        DOM.unlockedUserNameEl
            .textContent =
            userName;

    }


    // Hora

    if (
        DOM.unlockedTimeEl
    ) {

        DOM.unlockedTimeEl
            .textContent =
            new Date()
                .toLocaleTimeString();

    }


    showToastAlert(
        "¡Acceso Concedido!",
        `${userName} desbloqueó la vitrina.`,
        "success"
    );


    addLogEntry(
        `Acceso concedido a: ${userName}`,
        "success"
    );


    // Limpiar timers anteriores

    if (
        state.unlockTimeout
    ) {

        clearTimeout(
            state.unlockTimeout
        );

    }


    if (
        state.unlockCountdownInterval
    ) {

        clearInterval(
            state.unlockCountdownInterval
        );

    }


    // --------------------------------------
    // CUENTA REGRESIVA DE 5 MINUTOS
    // --------------------------------------

    let remaining =
        Math.max(
            1,
            Math.floor(
                durationSeconds
            )
        );


    updateAutoLockCounter(
        remaining
    );


    state.unlockCountdownInterval =
        setInterval(
            () => {

                remaining--;


                updateAutoLockCounter(
                    remaining
                );


                if (
                    remaining <= 0
                ) {

                    clearInterval(
                        state.unlockCountdownInterval
                    );


                    state.unlockCountdownInterval =
                        null;

                }

            },
            1000
        );


    state.unlockTimeout =
        setTimeout(
            async () => {

                if (
                    state.unlockCountdownInterval
                ) {

                    clearInterval(
                        state.unlockCountdownInterval
                    );


                    state.unlockCountdownInterval =
                        null;

                }


                await autoRelockVitrina();

            },
            remaining * 1000
        );

}


// ======================================================
// FORMATO DEL CONTADOR 05:00
// ======================================================

function updateAutoLockCounter(
    totalSeconds
) {

    const el =
        document.getElementById(
            "autolock-counter"
        );


    if (!el) return;


    const seconds =
        Math.max(
            0,
            totalSeconds
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const secs =
        seconds % 60;


    el.textContent =
        `Auto-cierre en: ${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

}


// ======================================================
// BLOQUEO AUTOMÁTICO
// ======================================================

async function autoRelockVitrina() {

    try {

        if (
            VITRINA_CONFIG.dbMode ===
            "firestore"
        ) {

            const vitrinaRef =
                getVitrinaFirestoreRef();


            await updateDoc(
                vitrinaRef,
                {

                    lockState:
                        "LOCKED",

                    systemState:
                        "READY",

                    unlockedBy:
                        null,

                    unlockedAt:
                        null,

                    unlockExpiresAt:
                        null,

                    updatedAt:
                        firestoreServerTimestamp(),

                    lastEvent: {

                        type:
                            "lock",

                        description:
                            "Bloqueo automático después de 5 minutos",

                        timestamp:
                            Date.now()

                    }

                }
            );

        }

        else {

            const dbRef =
                ref(
                    rtdb,
                    `grupo/${state.groupId}/vitrinas/${state.vitrinaId}`
                );


            await update(
                dbRef,
                {

                    lockState:
                        "LOCKED",

                    systemState:
                        "READY",

                    unlockedBy:
                        null,

                    unlockedAt:
                        null,

                    unlockExpiresAt:
                        null,

                    updatedAt:
                        rtdbServerTimestamp()

                }
            );

        }

    }

    catch (error) {

        console.warn(
            "Error bloqueando vitrina:",
            error
        );

    }


    handleLockEvent(
        "Vitrina cerrada automáticamente",
        true
    );

}


// ======================================================
// EVENTO DE BLOQUEO
// ======================================================

function handleLockEvent(
    reason =
        "Vitrina Asegurada",
    generateNewQR =
        true
) {

    state.isUnlocked =
        false;

    state.unlockedUser =
        null;


    if (
        state.unlockTimeout
    ) {

        clearTimeout(
            state.unlockTimeout
        );

        state.unlockTimeout =
            null;

    }


    if (
        state.unlockCountdownInterval
    ) {

        clearInterval(
            state.unlockCountdownInterval
        );

        state.unlockCountdownInterval =
            null;

    }


    audio.playLock();


    updateSystemStatusUI(
        "waiting_scan",
        "Esperando Escaneo"
    );


    if (
        DOM.unlockOverlayEl
    ) {

        DOM.unlockOverlayEl
            .classList
            .add("hidden");


        DOM.unlockOverlayEl
            .classList
            .remove("flex");

    }


    if (
        DOM.qrWrapperEl
    ) {

        DOM.qrWrapperEl
            .classList
            .remove("hidden");

    }


    showToastAlert(
        "Vitrina Cerrada",
        reason,
        "info"
    );


    addLogEntry(
        reason,
        "info"
    );


    if (generateNewQR) {

        state.remainingSeconds =
            VITRINA_CONFIG
                .qrRefreshIntervalSecs;


        rotateQRCode();

    }

}


// ======================================================
// TEMPORIZADOR DEL QR
// ======================================================

function startCountdownTimer() {

    if (
        state.timerInterval
    ) {

        clearInterval(
            state.timerInterval
        );

    }


    state.timerInterval =
        setInterval(
            () => {

                if (
                    state.isUnlocked
                ) {

                    return;

                }


                state.remainingSeconds -=
                    0.1;


                if (
                    state.remainingSeconds <=
                    0
                ) {

                    state.remainingSeconds =
                        VITRINA_CONFIG
                            .qrRefreshIntervalSecs;


                    rotateQRCode();

                }


                updateTimerDisplay();

            },
            100
        );

}


// ======================================================
// MOSTRAR TEMPORIZADOR QR
// ======================================================

function updateTimerDisplay() {

    const remaining =
        Math.max(
            0,
            state.remainingSeconds
        );


    const percentage =
        (
            remaining /
            state.totalSeconds
        ) * 100;


    if (
        DOM.timerProgressBarEl
    ) {

        DOM.timerProgressBarEl
            .style
            .width =
            `${percentage}%`;


        if (
            remaining <= 5
        ) {

            DOM.timerProgressBarEl
                .className =
                "h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-100";

        }

        else if (
            remaining <= 10
        ) {

            DOM.timerProgressBarEl
                .className =
                "h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-100";

        }

        else {

            DOM.timerProgressBarEl
                .className =
                "h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-100";

        }

    }


    if (
        DOM.timerSecondsEl
    ) {

        DOM.timerSecondsEl
            .textContent =
            `${Math.ceil(remaining)}s`;

    }

}


// ======================================================
// ESTADO VISUAL
// ======================================================

function updateSystemStatusUI(
    statusKey,
    label
) {

    if (
        !DOM.statusBadgeEl
    ) {

        return;

    }


    if (
        statusKey ===
        "unlocked"
    ) {

        DOM.statusBadgeEl
            .className =
            "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border bg-emerald-950/70 border-emerald-500/40 text-emerald-400";


        DOM.statusDotEl
            .className =
            "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping";


        DOM.statusTextEl
            .textContent =
            label ||
            "Desbloqueado";

    }

    else if (
        statusKey ===
        "waiting_scan"
    ) {

        DOM.statusBadgeEl
            .className =
            "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border bg-blue-950/70 border-blue-500/40 text-blue-400";


        DOM.statusDotEl
            .className =
            "w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse";


        DOM.statusTextEl
            .textContent =
            label ||
            "Esperando Escaneo";

    }

    else {

        DOM.statusBadgeEl
            .className =
            "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border bg-slate-800 border-slate-700 text-slate-300";


        DOM.statusDotEl
            .className =
            "w-2.5 h-2.5 rounded-full bg-slate-400";


        DOM.statusTextEl
            .textContent =
            label ||
            "En Espera";

    }

}


// ======================================================
// ESTADO DE CONEXIÓN
// ======================================================

function setConnectionStatus(
    online
) {

    state.isConnected =
        online;


    if (
        !DOM.connectionStatusEl
    ) {

        return;

    }


    if (online) {

        DOM.connectionStatusEl
            .innerHTML = `

            <span class="relative flex h-2.5 w-2.5">

                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>

                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>

            </span>

            <span class="text-emerald-400 font-medium text-xs">
                Conectado (Firebase Live)
            </span>
        `;

    }

    else {

        DOM.connectionStatusEl
            .innerHTML = `

            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>

            <span class="text-amber-400 font-medium text-xs">
                Reconectando...
            </span>
        `;

    }

}


// ======================================================
// TOAST
// ======================================================

function showToastAlert(
    title,
    message,
    type = "info"
) {

    if (
        !DOM.alertToastEl
    ) {

        return;

    }


    DOM.alertToastTitleEl
        .textContent =
        title;


    DOM.alertToastMessageEl
        .textContent =
        message;


    const bgMap = {

        success:
            "border-emerald-500/50 bg-slate-900/95 text-emerald-400",

        error:
            "border-red-500/50 bg-slate-900/95 text-red-400",

        info:
            "border-blue-500/50 bg-slate-900/95 text-blue-400"

    };


    DOM.alertToastEl
        .className =
        `fixed bottom-6 right-6 max-w-sm w-full p-4 rounded-xl border backdrop-blur-xl shadow-2xl z-50 flex items-start gap-3 transform transition-all duration-500 translate-y-0 opacity-100 ${bgMap[type] || bgMap.info}`;


    setTimeout(
        () => {

            DOM.alertToastEl
                .classList
                .add(
                    "translate-y-12",
                    "opacity-0"
                );

        },
        4500
    );

}


// ======================================================
// LOG VISUAL
// ======================================================

function addLogEntry(
    message,
    type = "info"
) {

    const time =
        new Date()
            .toLocaleTimeString();


    state.logs.unshift({
        time,
        message,
        type
    });


    if (
        state.logs.length >
        20
    ) {

        state.logs.pop();

    }


    if (
        !DOM.eventLogsEl
    ) {

        return;

    }


    DOM.eventLogsEl.innerHTML =
        state.logs
            .map(
                log => {

                    const colorClass =
                        log.type === "success"

                            ? "text-emerald-400 border-l-2 border-emerald-500 pl-2 bg-emerald-950/20"

                            : log.type === "error"

                            ? "text-red-400 border-l-2 border-red-500 pl-2 bg-red-950/20"

                            : "text-slate-300 border-l-2 border-blue-500/40 pl-2";


                    return `

                    <div class="py-1.5 px-2 rounded text-xs font-mono flex items-center justify-between ${colorClass}">

                        <span class="truncate">
                            ${log.message}
                        </span>

                        <span class="text-slate-500 text-[10px] ml-2 flex-shrink-0">
                            ${log.time}
                        </span>

                    </div>

                `;

                }
            )
            .join("");

}


// ======================================================
// RELOJ
// ======================================================

function startLiveClock() {

    function updateClock() {

        const now =
            new Date();


        if (
            DOM.clockEl
        ) {

            DOM.clockEl
                .textContent =
                now.toLocaleTimeString(
                    [],
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        second:
                            "2-digit",

                        hour12:
                            false
                    }
                );

        }


        if (
            DOM.dateEl
        ) {

            DOM.dateEl
                .textContent =
                now.toLocaleDateString(
                    "es-ES",
                    {
                        weekday:
                            "long",

                        day:
                            "numeric",

                        month:
                            "short",

                        year:
                            "numeric"
                    }
                );

        }

    }


    updateClock();


    setInterval(
        updateClock,
        1000
    );

}


// ======================================================
// SIMULAR DESBLOQUEO
// ======================================================

async function simulateUnlock() {

    try {

        const vitrinaRef =
            getVitrinaFirestoreRef();


        const now =
            Date.now();


        const expiresAt =
            now +
            (
                UNLOCK_DURATION_SECONDS *
                1000
            );


        // Usuario de prueba
        // Después esto vendrá desde la APP y Firebase Auth

        const testUser = {

            uid:
                "wWh1UGgpDgzTIDNuzaRK",

            nombre:
                "Christopher",

            rol:
                "Admin"

        };


        await updateDoc(
            vitrinaRef,
            {

                lockState:
                    "UNLOCKED",

                systemState:
                    "ACTIVE",

                unlockedBy:
                    testUser,

                unlockedAt:
                    Timestamp.fromMillis(
                        now
                    ),

                unlockExpiresAt:
                    Timestamp.fromMillis(
                        expiresAt
                    ),

                updatedAt:
                    firestoreServerTimestamp(),

                lastEvent: {

                    type:
                        "unlock",

                    description:
                        `Desbloqueo autorizado para ${testUser.nombre}`,

                    timestamp:
                        now

                }

            }
        );


        console.log(
            "Vitrina desbloqueada durante 5 minutos"
        );

    }

    catch (error) {

        console.error(
            "Error simulando desbloqueo:",
            error
        );


        showToastAlert(
            "Error",
            error.message,
            "error"
        );

    }

}


// ======================================================
// SIMULAR BLOQUEO
// ======================================================

async function simulateLock() {

    try {

        const vitrinaRef =
            getVitrinaFirestoreRef();


        await updateDoc(
            vitrinaRef,
            {

                lockState:
                    "LOCKED",

                systemState:
                    "READY",

                unlockedBy:
                    null,

                unlockedAt:
                    null,

                unlockExpiresAt:
                    null,

                updatedAt:
                    firestoreServerTimestamp(),

                lastEvent: {

                    type:
                        "lock",

                    description:
                        "Bloqueo manual activado",

                    timestamp:
                        Date.now()

                }

            }
        );

    }

    catch (error) {

        console.error(
            "Error bloqueando:",
            error
        );


        showToastAlert(
            "Error",
            error.message,
            "error"
        );

    }

}


// ======================================================
// BOTONES
// ======================================================

function setupEventListeners() {

    if (
        DOM.btnSimulateUnlock
    ) {

        DOM.btnSimulateUnlock
            .addEventListener(
                "click",
                simulateUnlock
            );

    }


    if (
        DOM.btnSimulateLock
    ) {

        DOM.btnSimulateLock
            .addEventListener(
                "click",
                simulateLock
            );

    }


    if (
        DOM.btnForceRefresh
    ) {

        DOM.btnForceRefresh
            .addEventListener(
                "click",
                () => {

                    if (
                        state.isUnlocked
                    ) {

                        showToastAlert(
                            "Vitrina abierta",
                            "No se puede generar otro QR mientras la vitrina está desbloqueada.",
                            "info"
                        );

                        return;

                    }


                    audio.playTick();


                    state.remainingSeconds =
                        VITRINA_CONFIG
                            .qrRefreshIntervalSecs;


                    rotateQRCode();


                    showToastAlert(
                        "QR Regenerado",
                        "Nuevo token generado y sincronizado con Firebase.",
                        "info"
                    );

                }
            );

    }

}


// ======================================================
// INICIALIZACIÓN
// ======================================================

export function initVitrinaApp() {

    console.log(
        "===================================="
    );

    console.log(
        "SISTEMA VITRINA IoT"
    );

    console.log(
        "Grupo:",
        state.groupId
    );

    console.log(
        "Vitrina:",
        state.vitrinaId
    );

    console.log(
        "Ruta Firestore:"
    );

    console.log(
        `grupo/${state.groupId}/vitrinas/${state.vitrinaId}`
    );

    console.log(
        "===================================="
    );


    if (
        DOM.vitrinaIdEl
    ) {

        DOM.vitrinaIdEl
            .textContent =
            state.vitrinaId;

    }


    startLiveClock();

    setupEventListeners();

    startFirebaseListener();

    rotateQRCode();

    startCountdownTimer();


    addLogEntry(
        `Sistema iniciado [${state.groupId}/${state.vitrinaId}]`,
        "info"
    );

}


// ======================================================
// INICIAR
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initVitrinaApp
);