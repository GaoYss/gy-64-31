async function health(r) {
    const body = JSON.stringify({
        status: "ok",
        component: "frontend",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        checks: {
            self: "ok",
        },
    });
    r.headersOut["Content-Type"] = "application/json; charset=utf-8";
    r.headersOut["Cache-Control"] = "no-store";
    r.return(200, body);
}

async function healthFull(r) {
    let backendData;
    let backendStatus;

    try {
        const reply = await r.subrequest("/health/backend", { method: "GET" });
        if (reply.status === 200) {
            backendData = JSON.parse(reply.responseText);
            backendStatus = "ok";
        } else {
            backendData = { error: `HTTP ${reply.status}` };
            backendStatus = "unreachable";
        }
    } catch (e) {
        backendData = { error: e.message || String(e) };
        backendStatus = "unreachable";
    }

    const overallStatus = backendStatus === "ok" ? "ok" : "degraded";
    const body = JSON.stringify({
        status: overallStatus,
        component: "frontend",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        checks: {
            self: "ok",
            backend: backendStatus,
        },
        backend: backendData,
    });

    r.headersOut["Content-Type"] = "application/json; charset=utf-8";
    r.headersOut["Cache-Control"] = "no-store";
    r.return(200, body);
}

export default { health, healthFull };
