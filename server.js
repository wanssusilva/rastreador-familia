const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// Função para embaralhar e sortear sem repetição
const getSimulado = () => {
    const rawData = fs.readFileSync('./questions.json');
    const questions = JSON.parse(rawData);
    
    // Algoritmo Fisher-Yates para embaralhar
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    // Retorna apenas as primeiras 20 questões únicas do sorteio
    return questions.slice(0, 20);
};

app.get('/api/simulado', (req, res) => {
    try {
        const simulado = getSimulado();
        res.json(simulado);
    } catch (error) {
        res.status(500).json({ error: "Erro ao ler banco de dados." });
    }
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
