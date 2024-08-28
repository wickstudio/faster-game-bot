# Faster Game Bot

## Overview

**Faster Game Bot** is an exciting Discord bot game developed by **Wick Studio**. It allows players to participate in a fast-paced quiz game where the quickest and most accurate responses win. The bot supports multiple rounds and keeps track of players' scores to determine the ultimate champion.

## Features

- **Multiplayer Quiz Game**: Up to 20 players can join the game.
- **Automatic Rounds**: The game progresses through a set number of rounds (15 by default).
- **Customizable Questions**: Questions are randomly selected from a JSON file (`quiz.json`).
- **Real-Time Feedback**: Players receive immediate feedback on their answers.
- **Leaderboard**: The bot announces the winners and their points at the end of the game.
- **Easy-to-Use Commands**: Start and stop the game with simple commands.

## Commands

- **`-faster`**: Starts a new game if one is not already in progress.
- **`-stop`**: Stops the current game and resets all game data.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/wickstudio/faster-game-bot.git
   cd faster-game-bot
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure the Bot**:
   - Create a `config.js` file in the root directory.
   - Add your bot's token and the role ID required to start/stop the game:

   ```javascript
   module.exports = {
     token: 'YOUR_BOT_TOKEN',
     roleId: 'YOUR_ROLE_ID',
   };
   ```

4. **Prepare the Quiz**:
   - Ensure you have a `quiz.json` file with your quiz questions in the root directory.
   - Each entry should be a string representing a quiz word.

5. **Run the Bot**:

   ```bash
   node index.js
   ```

## Usage

Invite the bot to your Discord server, assign the necessary role to users who can start/stop the game, and enjoy the fun!

- **Starting the Game**: Type `-faster` in any channel. Players can join by clicking the "Join Game" button.
- **Stopping the Game**: Type `-stop` to end the game prematurely.

## Contribution

We welcome contributions to enhance the bot! Feel free to submit issues or pull requests on GitHub.

## Support

For support and updates, join the [Wick Studio Discord server](https://discord.gg/wicks).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Credits

- Developed by [Wick Studio](https://discord.gg/wicks)
- Inspired by the need for fun and engaging Discord games!