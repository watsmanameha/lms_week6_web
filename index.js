import express from "express";
import { createReadStream } from "fs";
import crypto from "crypto";
import http from "http";
import bodyParser from "body-parser";

import appSrc, {createApp} from "./app.js";

const app = createApp(express, bodyParser, createReadStream, crypto, http);

app.listen(3000);