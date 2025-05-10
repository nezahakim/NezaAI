import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type User = {
  username: string;
  chatId: number | string;
  lastActive: number;
  reminded?: boolean;
};

class ReminderSystem {
  storageFile: string;
  users: Record<string, User>;

  constructor(storageFile = '../db/user_data.json') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.storageFile = path.join(__dirname, storageFile);
    this.users = {} ;
  }

  // Load user data
  async loadUsers() {
    try {
      const data = await fs.readFile(this.storageFile, 'utf8');
      this.users = JSON.parse(data);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading user data:', error);
      }
      this.users = {};
    }
  }

  // Save user data
  async saveUsers() {
    try {
      await fs.writeFile(this.storageFile, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Add or update a user's activity
  async updateUser(userId: string, chatId: string | number, username: string) {
    this.users[userId] = {
      username,
      chatId,
      lastActive: Date.now(),
      reminded: false
    };
    await this.saveUsers();
  }

  // Remove a user completely
  async removeUser(userId: string) {
    delete this.users[userId];
    await this.saveUsers();
  }

  // Check for inactive users and send reminders
  async checkAndNotifyInactiveUsers(ctx: any) {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const messages = [
      "👋 Hey {username}, it's been a while! Anything new you'd like to share?",
      "😊 Miss you in the chat, {username}. Let's catch up!",
      "🌟 Just checking in, {username}. Hope everything's going great!",
      "💬 Haven’t heard from you in a bit, {username}. What's on your mind today?",
      "🎯 Ready to continue your goals, {username}? I'm here to support you!"
    ] as any;

    for (const [userId, user] of Object.entries(this.users)) {
      const inactiveFor = now - user.lastActive;

      if (inactiveFor >= twentyFourHours && !user.reminded) {
        const message = messages[Math.floor(Math.random() * messages.length)].replace('{username}', `@${user.username}`);

        try {
          await ctx.telegram.sendMessage(user.chatId, message);
          console.log(`Reminder sent to ${user.username}`);

          if (this.users[userId]) {
            this.users[userId].reminded = true;
          }
        } catch (err) {
          console.error(`Failed to send message to ${user.username}`, err);
        }
      }

      // Reset reminder flag if user becomes active again
      if (inactiveFor < twentyFourHours && user.reminded && this.users[userId]) {
        this.users[userId].reminded = false;
      }
    }

    await this.saveUsers();
  }
}

export default ReminderSystem;
