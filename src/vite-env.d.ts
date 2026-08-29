/// <reference types="vite/client" />

declare module '*.glsl' {
    const value: string;
    export default value;
}

declare module '*?raw' {
    const value: string;
    export default value;
}
