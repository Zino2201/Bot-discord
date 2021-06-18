const {tryToSendChannelId, advertToEmbed} = require('../utils');

module.exports = async (client, msg, user) => {
    const dmChannel = msg.channel;
    const questions = [
        {
            step    : 'title',
            question: 'Ajoute un titre qui définit clairement ce que tu recherches',
        },
        {
            step    : 'description',
            question: 'Ajoute une description détaillée du projet et ce dont tu as besoin',
        },
        {
            step    : 'contact',
            question: 'Comment peut on te contacter?',
        },
        {
            step    : 'finish',
            question: 'Presque fini! Regarde ton poste et fais en sorte que ça soit juste.', 
            options : [
                '1. Envoyer mon poste', 
                '2. Recommencer',
            ] 
        }
    ];

    const answers = {};

    console.log(`${msg.author.tag} a commencé a postuler.`);

    for (let i = 0, cancel = false; i < questions.length && cancel === false; i++) {
        let questionMsg = questions[i].question;

        // Display options, if there are some
        const hasOptions = 'options' in questions[i];
        if (hasOptions) {
            for (const option of questions[i].options) {
                questionMsg += '\n'+option;
            }
        }
        await dmChannel.send(questionMsg);
        if (questions[i].step === 'finish') await dmChannel.send(advertToEmbed(answers));
        
        try {
            // Fetch message
            const collected = await dmChannel.awaitMessages(m => m.channel.type === 'dm', {max: 1, time: 5*60*1000, errors: ['time']});
            const msgContent = collected.last().content.trim();
            
            // !stop command
            // possible !edit command to change precedent answer
            if (msgContent.toLowerCase() === '!stop') {
                await dmChannel.send('**Application arrêté.**');
                console.log(`${msg.author.tag} a stopper la création d'une annonce.`);
                cancel = true;
            }

            // Check if content is the number of an option
            if (hasOptions) {
                // Check that it is a number in the question number's range 
                if (msgContent.length > 1 || !/[1-9]/.test(msgContent[0]) || (msgContent > questions[i].options.length)) {
                    await dmChannel.send('**Veuillez tapper le numéro de l\'option choisie**');
                    i--;
                    continue;
                }
            }

            // Save response
            answers[questions[i].step] = msgContent;
            console.log(`${msg.author.tag} - ${questions[i].step}: ${msgContent}`);

        } catch (error) {
            cancel = true;
            await dmChannel.send('**L\'annonce a été mis en arrêt suite a un délai trop long.**');
            console.log(`${msg.author.tag}: délai trop long.`);
        }

        // Send advert
        if (answers.finish == 1) tryToSendChannelId(client, process.env.ADVERT_CHANNEL_ID, advertToEmbed(answers)); 
        // Restart
        if (answers.finish == 2) {
            answers.finish = null;
            i = -1;
            continue;
        }
    }

    console.log(`${msg.author.tag} a fini de créer son annonce.`);
};
