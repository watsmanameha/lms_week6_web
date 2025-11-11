import express from "express";
import { createReadStream } from "fs";
import crypto from "crypto";
import http from "http";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import createApp from "./app.js";

const app = createApp(express, bodyParser, createReadStream, crypto, http, mongoose);

app.listen(process.env.PORT || 3000);