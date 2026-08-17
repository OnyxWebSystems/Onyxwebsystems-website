const { execSync } = require("child_process");

function listeningPids(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync("netstat -ano", { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        if (!line.includes(`:${port} `) && !line.endsWith(`:${port}`)) continue;
        const pid = line.trim().split(/\s+/).pop();
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      return [...pids];
    }

    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
    }).trim();
    return out ? out.split(/\s+/) : [];
  } catch {
    return [];
  }
}

for (const port of [3000, 3001]) {
  for (const pid of listeningPids(port)) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
      } else {
        process.kill(Number(pid), "SIGKILL");
      }
    } catch {
      // Process may already have exited.
    }
  }
}
