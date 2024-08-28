const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const { token, roleId } = require('./config');
const quiz = JSON.parse(fs.readFileSync('quiz.json', 'utf8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let gameActive = false;
let players = [];
let playerPoints = {};
let currentRound = 0;
const maxPlayers = 20; // عدد لاعبين الاقصى للانضمام
const minPlayers = 2; // عدد لاعبين الادنى للانضمام
const totalRounds = 15; // مجموع عدد الجولات

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Code by Wick Studio`);
  console.log(`discord.gg/wicks`);
});

client.on('messageCreate', async message => {
  if ((message.content === '-faster' || message.content === '-stop') && !message.member.roles.cache.has(roleId)) {
    return message.reply('ليس لديك الإذن لاستخدام هذا الأمر.');
  }

  if (message.content === '-faster' && !gameActive) {
    try {
      gameActive = true;
      players = [];
      playerPoints = {};

      const joinButton = new ButtonBuilder()
        .setCustomId('join_bomb_game')
        .setLabel('انضم للعبة')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮');

      const leaveButton = new ButtonBuilder()
        .setCustomId('leave_bomb_game')
        .setLabel('غادر اللعبة')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');

      const row = new ActionRowBuilder()
        .addComponents(joinButton, leaveButton);

      let embed = new EmbedBuilder()
        .setTitle('لعبة اسرع!')
        .setDescription('انقر على الأزرار للانضمام أو مغادرة اللعبة.')
        .setColor(0x00FF00)
        .addFields({ name: 'اللاعبين', value: 'لا يوجد لاعبون بعد', inline: true })
        .setFooter({ text: 'الرجاء الانضمام خلال 30 ثانية' })
        .setThumbnail(message.guild.iconURL({ dynamic: true }));

      const gameMessage = await message.channel.send({ embeds: [embed], components: [row] });

      const filter = interaction => ['join_bomb_game', 'leave_bomb_game'].includes(interaction.customId);
      const collector = gameMessage.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async interaction => {
        try {
          if (!gameActive) {
            await interaction.reply({ content: 'اللعبة قد انتهت بالفعل أو لم تبدأ بعد.', ephemeral: true });
            return;
          }
          if (interaction.customId === 'join_bomb_game') {
            if (players.length >= maxPlayers) {
              await interaction.reply({ content: `عذرًا، لا يمكن الانضمام للعبة. الحد الأقصى لعدد اللاعبين هو ${maxPlayers}.`, ephemeral: true });
              return;
            }
            if (!players.includes(interaction.user.id)) {
              players.push(interaction.user.id);
              playerPoints[interaction.user.id] = 0;
              const playerMentions = players.map(id => `<@${id}>`).join(', ');
              embed.spliceFields(0, 1, { name: 'اللاعبين', value: `${playerMentions || 'لا يوجد لاعبون بعد'}\n\nعدد اللاعبين: ${players.length}/${maxPlayers}`, inline: true });
              await gameMessage.edit({ embeds: [embed] });
              await interaction.reply({ content: `${interaction.user.tag} انضم إلى اللعبة!`, ephemeral: true });
            } else {
              await interaction.reply({ content: `أنت بالفعل في اللعبة!`, ephemeral: true });
            }
          } else if (interaction.customId === 'leave_bomb_game') {
            if (!players.includes(interaction.user.id)) {
              await interaction.reply({ content: 'أنت لست في اللعبة!', ephemeral: true });
              return;
            }
            players = players.filter(id => id !== interaction.user.id);
            delete playerPoints[interaction.user.id];
            const playerMentions = players.map(id => `<@${id}>`).join(', ');
            embed.spliceFields(0, 1, { name: 'اللاعبين', value: `${playerMentions || 'لا يوجد لاعبون بعد'}\n\nعدد اللاعبين: ${players.length}/${maxPlayers}`, inline: true });
            await gameMessage.edit({ embeds: [embed] });
            await interaction.reply({ content: `${interaction.user.tag} غادر اللعبة!`, ephemeral: true });
          }
        } catch (err) {
          console.error('Error handling join/leave interaction:', err);
          interaction.reply({ content: 'حدث خطأ أثناء معالجة الإجراء الخاص بك.', ephemeral: true });
        }
      });

      collector.on('end', async () => {
        try {
          if (players.length >= minPlayers) {
            const startEmbed = new EmbedBuilder()
              .setTitle('اللعبة ستبدأ قريباً!')
              .setDescription('ستبدأ اللعبة في 10 ثواني...')
              .setColor(0xFF0000)
              .setThumbnail(message.guild.iconURL({ dynamic: true }));

            await message.channel.send({ embeds: [startEmbed] });

            setTimeout(() => {
              try {
                startGame(message.channel);
              } catch (err) {
                console.error('Error starting game:', err);
                message.channel.send('حدث خطأ أثناء بدء اللعبة.');
              }
            }, 10000);
          } else {
            gameActive = false;
            await message.channel.send(`لم ينضم عدد كافٍ من اللاعبين إلى اللعبة. تم إلغاء اللعبة. يجب أن ينضم على الأقل ${minPlayers} لاعبين.`);
          }
        } catch (err) {
          console.error('Error ending join/leave collector:', err);
          message.channel.send('حدث خطأ أثناء إنهاء جمع التفاعلات.');
        }
      });
    } catch (err) {
      console.error('Error starting game:', err);
      message.channel.send('حدث خطأ أثناء بدء اللعبة.');
    }
  }

  if (message.content === '-stop' && gameActive) {
    try {
      gameActive = false;
      players = [];
      playerPoints = {};
      currentRound = 0;
      await message.channel.send('تم إيقاف اللعبة.');
    } catch (err) {
      console.error('Error stopping game:', err);
      message.channel.send('حدث خطأ أثناء إيقاف اللعبة.');
    }
  }
});

async function startGame(channel) {
  try {
    if (players.length > 0) {
      currentRound = 1;
      askQuestion(channel);
    }
  } catch (err) {
    console.error('Error starting game:', err);
    channel.send('حدث خطأ أثناء بدء اللعبة.');
  }
}

async function askQuestion(channel) {
  try {
    if (currentRound > totalRounds) {
      announceWinners(channel);
      return;
    }

    const word = quiz[Math.floor(Math.random() * quiz.length)];
    const imageBuffer = await generateImage(word);

    const attachment = new AttachmentBuilder(imageBuffer, { name: 'question.png' });

    await channel.send({ files: [attachment] });

    let answered = false;
    const filter = response => players.includes(response.author.id) && response.content.toLowerCase() === word.toLowerCase();
    const collector = channel.createMessageCollector({ filter, time: 15000 });

    collector.on('collect', async response => {
      if (!answered) {
        answered = true;
        playerPoints[response.author.id]++;
        await response.reply('صحيح! حصلت على نقطة.');

        collector.stop();

        setTimeout(() => {
          currentRound++;
          askQuestion(channel);
        }, 3000);
      }
    });

    collector.on('end', async collected => {
      try {
        if (!collected.size) {
          await channel.send('انتهى الوقت ولم يجاوب أحد بشكل صحيح.');
          setTimeout(() => {
            currentRound++;
            askQuestion(channel);
          }, 3000);
        }
      } catch (err) {
        console.error('Error handling incorrect answer or timeout:', err);
        channel.send('حدث خطأ أثناء معالجة الإجابة الخاطئة أو انتهاء الوقت.');
      }
    });
  } catch (err) {
    console.error('Error asking question:', err);
    channel.send('حدث خطأ أثناء طرح السؤال.');
  }
}

async function announceWinners(channel) {
  try {
    gameActive = false;
    const sortedPlayers = Object.entries(playerPoints).sort((a, b) => b[1] - a[1]);
    const topPlayers = sortedPlayers.slice(0, 3);
    const otherPlayers = sortedPlayers.slice(3);
    const winnerMentions = topPlayers.map(([id, points], index) => `${index + 1}. <@${id}> - ${points} نقطة`).join('\n');
    const otherMentions = otherPlayers.map(([id, points]) => `<@${id}> - ${points} نقطة`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🎉 المشاركين في اللعبة! 🎉')
      .setDescription('قائمة لمشاركين في اللعبة')
      .setColor(0xFFD700)
      .setThumbnail(channel.guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '🥇 المركز الأول', value: topPlayers[0] ? `<@${topPlayers[0][0]}> - ${topPlayers[0][1]} نقطة` : 'لا يوجد', inline: true },
        { name: '🥈 المركز الثاني', value: topPlayers[1] ? `<@${topPlayers[1][0]}> - ${topPlayers[1][1]} نقطة` : 'لا يوجد', inline: true },
        { name: '🥉 المركز الثالث', value: topPlayers[2] ? `<@${topPlayers[2][0]}> - ${topPlayers[2][1]} نقطة` : 'لا يوجد', inline: true }
      )
      .addFields(
        { name: 'المشاركون الآخرون', value: otherMentions || 'لا يوجد' }
      )
      .setFooter({ text: 'لعبة مقدمة من Wick Studio', iconURL: channel.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Error announcing winners:', err);
    channel.send('حدث خطأ أثناء إعلان الفائزين.');
  }
}

async function generateImage(word) {
  try {
    const canvas = createCanvas(1024, 512);
    const ctx = canvas.getContext('2d');
    const background = await loadImage('./image.png');

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(word, 330, 320);

    return canvas.toBuffer();
  } catch (err) {
    console.error('Error generating image:', err);
    throw new Error('حدث خطأ أثناء إنشاء الصورة.');
  }
}

client.login(token).catch(err => {
  console.error('Error logging in:', err);
  process.exit(1);
});
