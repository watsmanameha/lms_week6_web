import express from 'express';
import bodyParser from 'body-parser';
import { createReadStream } from 'node:fs';
import * as crypto from 'node:crypto';
import * as http from 'node:http';
import initApp from './app.js';

const app = initApp(express, bodyParser, createReadStream, crypto, http);
const port = process.env.PORT ?? 3000;
app.listen(port);
