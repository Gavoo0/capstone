const express = require('express');
const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API REST Escuela de Conductores Futuro en linea' });
});
app.listen(4000, () => { console.log('Servidor en http://localhost:4000'); });
