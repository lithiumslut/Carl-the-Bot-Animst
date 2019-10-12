//z.startFold - Ping Machine
//guide followed: https://anidiots.guide/other-guides/hosting-on-glitch
//ping glitch every 5 minutes to keep bot alive, DO NOT TOUCH
const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
//z.endFold

//meat of the bot
//z.startFold - require documents
const Discord = require("discord.js");
const SQLite = require("better-sqlite3");
const sql = new SQLite("./main.sqlite");
const config = require("./config.json");
//z.endFold
//z.startFold - define client, date, prefix, and score
const client = new Discord.Client();
var date = new Date();
var prefix = config.prefix;
let score;
//z.endFold

client.on("ready",() => {
  console.log(`I'm online at ${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`);

  const punTable = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='puns';").get();

  if(!punTable["count(*)"]) {
    sql.prepare("CREATE TABLE puns (id INTEGER PRIMARY KEY, user TEXT, guild TEXT, pun TEXT)").run();

    sql.prepare("CREATE UNIQUE INDEX idx_scored_id ON scores (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  client.getPun = sql.prepare("SELECT * FROM puns ORDER BY RANDOM() LIMIT 1;");
  client.setPun = sql.prepare("INSERT INTO puns (id, user, guild, pun) VALUES (@id, @user, @guild, @pun);");
});

client.on("message", message => {
  //z.startFold - user filter
  if (message.author === client.user || message.author.bot || !message.guild) return;
  //z.endFold
  //z.startFold - defining arguments
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  //z.endFold
  //z.startFold - get mentions
  function getMention(mention) {
    if (!mention) return;

    if (mention.startsWith("<@") && mention.endsWith(">")) {
      mention = mention.slice(2, -1);

      if (mention.startsWith("!")) {
        mention = mention.slice(1);
      }

      return client.users.get(mention);
    } //users
    else if (mention.startsWith("<#") && mention.endsWith(">")) {
      mention = mention.slice(2, -1);

      if (mention.startsWith("!")) {
        mention = mention.slice(1);
      }

      return client.users.get(mention);
    } //channels
  }
  //z.endFold
  //z.startFold - embed template
  let embed = new Discord.RichEmbed().setColor(0x000000);
  //z.endFold

  if (command === "ping") {

    embed.setAuthor("Ping", client.user.avatarURL)
      .addField("Pong!", `${Date.now() - message.createdTimestamp}ms`);
  }
  else if (command === "pun") {
    pun = client.getPun.get();
    embed.setAuthor("Random Pun", client.user.avatarURL)
      .setDescription(pun.pun)
      .setFooter(`Pun #${pun.id} by ${client.users.get(pun.user).tag}`, client.users.get(pun.user).avatarURL);
  }
  else if (command === "newpun") {

    const pun = sql.prepare("SELECT *, MAX(id) FROM puns");
    pun.id++;
    const punInfo = {id: pun.id, user: message.author.id, guild: message.guild.id, pun: message.content.slice((config.prefix.length + 6)).trim()};

    client.setPun.run(punInfo);

    embed.setAuthor("Pun Added!", client.user.avatarURL)
      .setDescription(`"${punInfo.pun}"`)
      .setFooter(`Pun #${punInfo.id} by ${client.users.get(punInfo.user).tag}`, client.users.get(punInfo.user).avatarURL);
  }
  //not a command
  else if (message.content.startsWith(prefix)) {

    embed.setAuthor("Error", client.user.avatarURL)
      .addField("Whoa there!", `That's not a command! Use ${prefix} for a list of commands!`);
    message.channel.send(embed).then(msg => {msg.delete(5000);}).catch(console.error); //https://discord.js.org/#/docs/main/stable/class/Message?scrollTo=delete
    return;
  }
  //end ifs
  else {
    return;
  }
  //z.endfold
  message.channel.send(embed);
});

client.login(process.env.TOKEN);
