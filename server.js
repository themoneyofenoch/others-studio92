/**
 * Passenger startup file — Hostinger hBuilds boots THIS file (see .htaccess:
 * `PassengerStartupFile server.js`), NOT npm start.
 *
 * Boots the Next.js standalone server built by `npm run build`.
 * The build patches the standalone server to bind 0.0.0.0 (HOSTNAME trap).
 */
process.env.NODE_ENV = process.env.NODE_ENV || "production";
require("./.next/standalone/server.js");
