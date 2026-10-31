import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import server from "./dist/server/server.js";

const app = new Hono();
app.use("/*", serveStatic({ root: "./dist/client" }));
app.all("*", (c) => server.fetch(c.req.raw, {}, {}));

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log("Frontend running on port " + port);