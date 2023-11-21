import { useState } from 'react';

let fps = 25;

export const useFps = () => {
    const [FPS, setFps] = useState(fps);
    fps = FPS;
    return { FPS, setFps };
};
