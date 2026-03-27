const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Determina ruta base según entorno (desarrollo vs ejecutable pkg)
// Cuando se empaqueta con pkg, process.pkg existe y el ejecutable vive en process.execPath
// Esto permite servir la carpeta "public" que se copiará junto al .exe en dist/public
const isPackaged = !!process.pkg;
const basePath = isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..');
const publicDir = path.join(basePath, 'public');
const appIndexPath = path.join(publicDir, 'app/index.html');
const hasReactApp = fs.existsSync(appIndexPath);

function sendSpa(res) {
    if (!hasReactApp) {
        return res.status(503).send(
            'Frontend no compilado. Ejecuta "npm run frontend:build" para generar public/app.'
        );
    }
    return res.sendFile(appIndexPath);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehiculos', require('./routes/vehiculos'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/empresa', require('./routes/empresa'));
app.use('/api/tarifas', require('./routes/tarifas'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/turnos', require('./routes/turnos'));

// Rutas de vistas SPA React (Vite build con base /app)
app.get('/', (req, res) => {
    res.redirect('/app/login');
});

app.get('/app', (req, res) => {
    sendSpa(res);
});

app.get('/app/*', (req, res) => {
    sendSpa(res);
});

const legacyToApp = (legacyPath) => {
    const clean = String(legacyPath || '').replace(/\.html$/i, '');
    const map = {
        dashboard: '/app/dashboard',
        vehiculos: '/app/vehiculos',
        'ingreso-salida': '/app/ingreso-salida',
        configuracion: '/app/configuracion',
        tarifas: '/app/tarifas',
        usuarios: '/app/usuarios',
        reportes: '/app/reportes',
    };
    return map[clean] || '/app/dashboard';
};

app.get('/admin/:page', (req, res) => {
    res.redirect(legacyToApp(req.params.page));
});

app.get('/operador/:page', (req, res) => {
    res.redirect(legacyToApp(req.params.page));
});

app.get('/admin/:page.html', (req, res) => {
    res.redirect(legacyToApp(req.params.page));
});

app.get('/operador/:page.html', (req, res) => {
    res.redirect(legacyToApp(req.params.page));
});

// 404 de API
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

// Fallback SPA para cualquier otra ruta web
app.use((req, res) => {
    sendSpa(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
