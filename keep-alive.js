import express from "express";
import http from "http";
import https from "https";

const app = express();
const PORT = process.env.PORT || 8000;

let REAL_URL = null;
let BOT_HEALTHY = false;

// Guess from env first (Render/Koyeb)
if (process.env.RENDER_EXTERNAL_URL) REAL_URL = process.env.RENDER_EXTERNAL_URL;
if (process.env.KOYEB_PUBLIC_URL) REAL_URL = process.env.KOYEB_PUBLIC_URL;

// Log helper
const log = (...msg) => console.log("[KeepAlive ADV]", ...msg);

// ✅ Learn REAL public URL from proxy headers (Koyeb + Render reliable)
app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    const host = req.headers["x-forwarded-host"] || req.headers.host;

    if (proto && host) {
        const newURL = `${proto}://${host}`;
        if (REAL_URL !== newURL) {
            REAL_URL = newURL;
            log("✅ Learned domain:", REAL_URL);
            restartExternalPinger();
        }
    }
    next();
});

// ✅ UI
app.get("/", (req, res) => {
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);

    res.send(`
        <html>
<html>
<head>
    <title>HyperWa Bot</title>
    <!-- Auto-refresh every 10 seconds -->
    <meta http-equiv="refresh" content="10">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
        /* --- Variables & Global Reset (Futuristic/Neon) --- */
        :root {
            --bg-dark: #070710;
            --card-dark-transparent: rgba(16, 16, 30, 0.6); 
            --neon-blue: #00e5ff;
            --neon-green: #39ff14;
            --neon-yellow: #ffeb3b;
            --text-light: #e0f7fa;
            --font-primary: 'Consolas', 'Courier New', monospace; /* Digital/Tech Font */
        }

        body {
            margin: 0;
            /* Deep space background gradient */
            background: linear-gradient(145deg, #050117, #1a0a33);
            font-family: var(--font-primary);
            color: var(--text-light);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
            padding: 20px;
        }

        .card {
            /* Holographic/Glass effect */
            background: var(--card-dark-transparent); 
            backdrop-filter: blur(12px); 
            -webkit-backdrop-filter: blur(12px);
            
            padding: 40px;
            border-radius: 12px;
            
            /* Enhanced Multi-Layer Neon Glow */
            border: 1px solid rgba(0, 229, 255, 0.3); 
            box-shadow: 
                0 0 60px rgba(0, 229, 255, 0.15), /* Wide, faint blue glow */
                0 0 25px rgba(57, 255, 20, 0.2), /* Green accent glow */
                inset 0 0 10px rgba(0, 229, 255, 0.1); /* Inner neon border */

            width: 450px;
            max-width: 90%;
            text-align: center;
            animation: pulse 2s infinite alternate; /* Subtle breathing effect */
        }

        @keyframes pulse {
            from { transform: scale(1); }
            to { transform: scale(1.005); } 
        }

        h1 {
            margin-top: 0;
            margin-bottom: 30px;
            color: var(--neon-blue);
            text-transform: uppercase;
            letter-spacing: 4px;
            /* Stronger Text glow */
            text-shadow: 0 0 10px rgba(0, 229, 255, 0.8), 0 0 20px rgba(0, 229, 255, 0.2);
        }

        table {
            width: 100%;
            margin-top: 25px;
            border-collapse: separate; 
            border-spacing: 0 10px; 
            text-align: left;
        }

        td {
            padding: 8px 0;
            font-size: 15px;
            color: var(--text-light);
            vertical-align: middle;
        }

        td:first-child {
            font-weight: bold;
            color: var(--neon-blue);
            text-transform: uppercase;
            opacity: 0.9;
            width: 45%; 
        }
        
        td:last-child {
            text-align: right;
        }

        .badge {
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
            min-width: 100px; 
            display: inline-block;
            transition: all 0.3s ease-in-out;
        }

        .ok { 
            background: var(--neon-green); 
            color: var(--bg-dark); 
            box-shadow: 0 0 10px rgba(57, 255, 20, 0.6);
        }
        .init { 
            background: var(--neon-yellow); 
            color: var(--bg-dark); 
            box-shadow: 0 0 10px rgba(255, 235, 59, 0.6);
        }

        code {
            background: rgba(0, 229, 255, 0.1);
            color: var(--neon-blue);
            padding: 2px 6px;
            border-radius: 4px;
        }
    </style>
</head>

<body>
    <div class="card">
        <h1>System Status</h1>

        <table>
            <tr>
                <td>Core Status</td>
                <td><span class="badge ok">Online</span></td> 
            </tr>

            <tr>
                <td>System Uptime</td>
                <td>${h}h ${m}m ${s}s</td>
            </tr>

            <tr>
                <td>Network Endpoint</td>
                <td>${REAL_URL || "Pending Detection..."}</td>
            </tr>

            <tr>
                <td>Bot Health</td>
                <td>
                    <span class="badge ${BOT_HEALTHY ? "ok" : "init"}">
                        ${BOT_HEALTHY ? "CONNECTED" : "BOOTING UP"}
                    </span>
                </td>
            </tr>
        </table>
        
        <p style="opacity:.6;font-size:12px;margin-top:35px;">
            Debug Console: <code>/whoami</code> | API Health: <code>/health</code>
        </p>
    </div>
</body>
</html>
    `);
});

// ✅ Health
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        uptime: process.uptime(),
        detected: REAL_URL,
        bot: BOT_HEALTHY,
        ts: new Date().toISOString()
    });
});

// ✅ Whoami debug
app.get("/whoami", (req, res) => {
    res.json({
        detected_url: REAL_URL,
        headers: {
            "x-forwarded-proto": req.headers["x-forwarded-proto"],
            "x-forwarded-host": req.headers["x-forwarded-host"],
            host: req.headers.host
        }
    });
});

// ✅ Bot status endpoint
app.post("/bot-status", (req, res) => {
    BOT_HEALTHY = req.body?.healthy !== false;
    res.json({ ok: true });
});

// ✅ Local ping (keeps Node active)
let localTimer = null;
function startLocalPinger() {
    if (localTimer) clearInterval(localTimer);

    const localURL = `http://127.0.0.1:${PORT}/health`;
    log("Local pinger ->", localURL);

    localTimer = setInterval(() => {
        http.get(localURL, res => res.resume());
    }, 120000); // every 2 min
}
startLocalPinger();

// ✅ External pinger (only after REAL_URL learned)
let externalTimer = null;

function restartExternalPinger() {
    if (!REAL_URL) return;
    if (externalTimer) clearInterval(externalTimer);

    const url = REAL_URL + "/health";
    const isHttps = REAL_URL.startsWith("https");
    const proto = isHttps ? https : http;

    log("External pinger ->", url);

    externalTimer = setInterval(async () => {
        try {
            const time = new Date().toISOString();
            log(`PING → ${url} @ ${time}`);

            proto.get(url, res => {
                res.on("data", () => {});
                res.on("end", () => {
                    if (res.statusCode === 200) {
                        log("✅ External ping OK");
                    } else {
                        log("⚠️ Non-200 status:", res.statusCode);
                    }
                });
            }).on("error", () => {
                log("❌ External ping failed");
            });

        } catch {}
    }, 240000); // every 4 minutes
}

// ✅ Domain verification (HEAD request) every 10 min
setInterval(() => {
    if (!REAL_URL) return;

    const checkURL = REAL_URL + "/health";
    const proto = REAL_URL.startsWith("https") ? https : http;

    proto.request(checkURL, { method: "HEAD", timeout: 3000 }, (res) => {
        if (res.statusCode === 200) log("✅ Domain verified:", REAL_URL);
        else log("⚠️ Domain check returned:", res.statusCode);
    }).on("error", () => {
        log("❌ Domain failed. Waiting for new whoami header...");
    }).end();

}, 600000); // every 10 minutes

// ✅ Start server
const server = app.listen(PORT, "0.0.0.0", () => {
    log(`Server running on ${PORT}`);
    log(`Initial URL: ${REAL_URL || "none"}`);
    if (REAL_URL) restartExternalPinger();
});

// ✅ Safe exit
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));

export { server, app };
