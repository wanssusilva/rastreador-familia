const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rota que o Front-end consome
app.get('/api/simulado', (req, res) => {
    try {
        const fileData = fs.readFileSync('./questions.json', 'utf8');
        let allQuestions = JSON.parse(fileData);

        // Embaralhamento Robusto (Fisher-Yates)
        for (let i = allQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }

        // Seleciona as primeiras 20 questões únicas após o embaralhamento
        const simuladoSorteado = allQuestions.slice(0, 20);
        res.json(simuladoSorteado);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao processar o banco de dados." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Back-end da Tainara Ativo!`);
    console.log(`🚀 Acesse o simulado em seu navegador através do index.html`);
    console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
});
