import { exec } from "child_process";

export const analizePort = (dynamicPort: string | number, defaultPort: string | number): Promise<number> => {
    let port = -1;
    if (dynamicPort) {
        dynamicPort = Number(dynamicPort);
        defaultPort = Number(defaultPort);
        port = !isNaN(dynamicPort) ? dynamicPort : !isNaN(defaultPort) ? defaultPort : 6379;
    }

    let command = '';
    switch (process.platform) {
        case 'win32':
            command = `netstat -ano | findstr :${port}`;
            break;
        case 'darwin':
        case 'linux':
            command = `lsof -i :${port}`;
            break;
        case 'freebsd':
            command = `sockstat -4l | grep :${port}`;
            break;
        case 'openbsd':
            command = `fstat | grep :${port}`;
            break;
        default: {
            console.log('Platform not specifically handled.');
            process.exit();
        }
    }

    return new Promise((resolve) => {
        exec(command, (_, stdout) => {
            if (stdout.trim()) {
                console.log(`Port ${port} is already in use:\n${stdout}`);
                process.exit(1);
            }
            resolve(port);
        });
    });
};