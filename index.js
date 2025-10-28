import express from "express";
import { createReadStream } from "fs";
import crypto from "crypto";
import http from "http";
import bodyParser from "body-parser";

import { createApp } from "./app.cjs";

const app = createApp(express, bodyParser, createReadStream, crypto, http);
const PORT = process.env.PORT || 3000;
app.listen(PORT);