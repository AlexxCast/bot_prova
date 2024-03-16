const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const Riassumi = 'Riassumi';
const bot = new Telegraf('7098363355:AAF4_6GJic3JWyy6TSCF8ClSR6MB3J6c34g', { polling: true });

// Connessione al database MySQL
var mysql = require('mysql');
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prova bot'
});

con.connect((err) => {
    if (err) {
        console.error('Errore durante la connessione al database:', err);
        return;
    }
    console.log('Connesso al database MySQL');
});
async function query(data) {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
            data,
            {
                headers: { Authorization: 'Bearer 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' }
            }
        );
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Errore durante la query:', error);
        throw error;
    }
}
// Messaggio di benvenuto e tastiera
const keyboard = Markup.keyboard([
    [Riassumi],
]);

bot.start((ctx) => ctx.reply('Benvenuto!', keyboard));

// Gestione del comando "Riassumi"
bot.hears(Riassumi, async ctx => {
    console.log(ctx.message.text);
    if (ctx.message.text == Riassumi) {
        var queryout = "SELECT text FROM messaggi ";
        console.log(queryout);
        con.query(queryout, function (err, results) {
            if (err) {
                console.error('Errore durante la query al database:', err);
                return;
            }
            var accumulatedText = '';
            results.forEach(function (row) {

                accumulatedText += row.text + ', ';

            })
            ai(accumulatedText);
        });

    }
    // Effettua la domanda a Hugging Face
    async function ai(dill) {
        const question = "in italiano: sintetizza le domande togliendo i doppioni: " + "'" + dill + "'";
        const data = { inputs: question };
        try {
            const response = await query(data);
            // Invia la risposta a chi ha inviato il comando "Riassumi"

            var nuovaStringa = response[0].generated_text.replace(question, '');
            ctx.reply(nuovaStringa);
            console.debug(question);
        } catch (error) {
            // console.error("Errore durante la query a Hugging Face:", error);
            ctx.reply("Si è verificato un errore durante l'interrogazione a Hugging Face.");
        }
    };
});

// Ricezione di tutti gli altri messaggi
bot.on('message', (ctx) => {
    console.log(ctx.message.text);
    if (ctx.message.text != Riassumi) {
        const regex = /^(.*?)\?$/; // Cattura tutto il testo prima del punto interrogativo
        var domanda = ctx.message.text.replace(/\?/g, '');
        domanda = domanda.replace(/\'/g, '');
        console.debug(domanda);
        const query = "INSERT INTO messaggi (text) VALUES ('" + domanda + "')";
        const values = [ctx.message.text];

        con.query(query, domanda, (err, results) => {
            if (err) {
                console.error('Errore durante l\'inserimento del messaggio:', err);
                return;
            }
            console.log('Messaggio inserito correttamente:', results);
        });
    }
});


bot.launch();
