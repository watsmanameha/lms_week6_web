import express from "express";
import { createReadStream } from "fs";
import crypto from "crypto";
import http from "http";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import pug from "pug";
import { createProxyMiddleware } from "http-proxy-middleware";
import puppeteer from "puppeteer";
import { PNG } from "pngjs";

import createApp from "./app.js";

const app = createApp(express, bodyParser, createReadStream, crypto, http, mongoose, pug, createProxyMiddleware, puppeteer, PNG);

app.listen(process.env.PORT || 3000);