import express from "express";
import { createReadStream } from "fs";
import crypto from "crypto";
import http from "http";
import bodyParser from "body-parser";

import appPkg from "./app.cjs";
const { createApp } = appPkg;

const appFilePath = new URL("./app.cjs", import.meta.url).pathname;

const app = createApp(express, bodyParser, createReadStream, crypto, http, appFilePath);
app.listen(process.env.PORT || 3000);
