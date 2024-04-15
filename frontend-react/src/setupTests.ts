//import "jest-canvas-mock";
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { createMocks } from "react-idle-timer";
import {
    fetch,
    FileReader,
    FormData,
    Headers,
    Request,
    Response,
} from "undici";
import { Blob, File } from "node:buffer";
import { MessageChannel } from "worker_threads";

vi.stubGlobal("scrollTo", vi.fn());
vi.mock("./oktaConfig");
vi.mock("focus-trap-react");

beforeAll(() => {
    createMocks();
    // @ts-expect-error ignore global
    global.MessageChannel = MessageChannel;
});

afterAll(cleanup);

/** JSDOM Polyfills */
Object.defineProperties(globalThis, {
    fetch: { value: fetch, writable: true },
    Blob: { value: Blob },
    File: { value: File },
    Headers: { value: Headers },
    FormData: { value: FormData },
    Request: { value: Request },
    Response: { value: Response },
    FileReader: { value: FileReader },
});
