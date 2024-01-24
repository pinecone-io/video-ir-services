const log = async (message: string, payload: object = {}) => {
    const podId = process.env.POD_NAME || 'unknown';
    const formattedMessage = `${podId}: ${message}`;
    try {
        await fetch('http://video-ir-dev-app-backend:3000/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: formattedMessage, payload: {
                    ...payload,
                    podId
                }
            })
        });
    } catch (error) {
        console.error('Failed to log message', error);
    }
}

const trackFile = async (file: string) => {
    const podId = process.env.POD_NAME || 'unknown';

    try {
        await fetch('http://video-ir-dev-app-backend:3000/api/trackFile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file, podId })
        });
    } catch (error) {
        console.error('Failed to log message', error);
    }
}



export { log, trackFile };