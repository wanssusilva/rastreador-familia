const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/simulado', (req, res) => {
    try {
        const data = fs.readFileSync('./perguntas.json', 'utf8');
        let lista = JSON.parse(data);
        lista.sort(() => Math.random() - 0.5);
        res.json(lista.slice(0, 20));
    } catch (e) {
        res.status(500).json({erro: "Erro ao carregar perguntas"});
    }
});

app.listen(3000, () => console.log("Servidor ativo"));
